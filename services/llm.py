import os

from openai import OpenAI
from openai import APITimeoutError
from pydantic import BaseModel


class SuggestionOutput(BaseModel):
    text: str
    notes: str = ''


def get_client():
    timeout = float(os.environ.get('OPENROUTER_TIMEOUT_SECONDS', '20'))
    return OpenAI(
        api_key=os.environ.get('OPENROUTER_API_KEY', ''),
        base_url='https://openrouter.ai/api/v1',
        timeout=timeout,
    )


def get_suggestion(
    block, suggestion_type: str, instruction: str = ''
) -> str:
    """Call OpenRouter and return suggested text for the block."""
    current = block.current_version()
    if not current:
        return ''

    if suggestion_type == 'custom':
        prompt = instruction
    else:
        prompts = {
            'rewrite': 'Rewrite this paragraph more clearly and concisely.',
            'improve': 'Improve the clarity and precision of this paragraph.',
            'shorten': (
                'Shorten this paragraph significantly while preserving '
                'key meaning.'
            ),
            'expand': 'Expand this paragraph with more detail and context.',
        }
        prompt = prompts.get(suggestion_type, prompts['improve'])
    instruction = prompt

    client = get_client()
    model = os.environ.get(
        'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4-5'
    )
    messages = [
        {
            'role': 'system',
            'content': (
                'You are a professional editor helping draft policy '
                'and political documents. Respond with a JSON object '
                'containing two fields: "text" (the revised paragraph; '
                'you may use **bold**, *italic*, and simple lists where '
                'appropriate, but prefer prose; no headings, no HTML) '
                'and "notes" (brief summary of changes made).'
            ),
        },
        {
            'role': 'user',
            'content': f'{instruction}\n\n{current.text}',
        },
    ]

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={'type': 'json_object'},
            max_tokens=1500,
        )
        raw = response.choices[0].message.content
        output = SuggestionOutput.model_validate_json(raw)
        return output.text
    except APITimeoutError:
        return ''
    except Exception:
        # Fall back: plain text request without structured output
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        'role': 'system',
                        'content': (
                            'You are a professional editor helping draft policy '
                            'and political documents. Return only the revised '
                            'paragraph text — you may use **bold**, *italic*, '
                            'and simple lists where appropriate, but prefer '
                            'prose; no headings, no HTML, no explanations.'
                        ),
                    },
                    messages[1],
                ],
                max_tokens=1500,
            )
            return response.choices[0].message.content.strip()
        except APITimeoutError:
            return ''
