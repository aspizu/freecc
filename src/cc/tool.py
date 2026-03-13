from abc import ABC, abstractmethod
from typing import Any, Self, get_type_hints

from pydantic import BaseModel, ValidationError

from .chat import Chat, ChatError


def get_args(tool: type[Tool]) -> dict[str, Any]:
    return {
        k: v
        for k, v in get_type_hints(tool).items()
        if k not in ["body", "run", "new", "usage", "return"]
    }


class Tool(BaseModel, ABC):
    body: str | None

    @abstractmethod
    async def run(self) -> Chat | str | None:
        raise NotImplementedError

    @classmethod
    def new(cls, args: dict[str, Any] | list[Any], body: str | None) -> Self:
        h = get_args(cls)
        if isinstance(args, list):
            args = {k: v for k, v in zip(h, args)}
        try:
            return cls(**args, body=body)
        except ValidationError as err:
            raise ChatError(str(err))

    @classmethod
    def usage(cls) -> str:
        return f"$freecc.{cls.__name__[0].lower() + cls.__name__[1:]}{cls.__doc__}"
