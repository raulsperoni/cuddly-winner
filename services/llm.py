import os

from openai import OpenAI


def get_client():
    return OpenAI(
        api_key=os.environ.get('OPENROUTER_API_KEY', ''),
        base_url='https://openrouter.ai/api/v1',
    )


def get_suggestion(block, suggestion_type: str) -> str:
    """Call OpenRouter and return suggested text for the block."""
    current = block.current_version()
    if not current:
        return ''

    prompts = {
        'rewrite': 'Rewrite this paragraph more clearly and concisely.',
        'improve': 'Improve the clarity and precision of this paragraph.',
        'shorten': (
            'Shorten this paragraph significantly while preserving '
            'key meaning.'
        ),
        'expand': 'Expand this paragraph with more detail and context.',
    }
    instruction = prompts.get(suggestion_type, prompts['improve'])

    client = get_client()
    model = os.environ.get(
        'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4-5'
    )
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                'role': 'system',
                'content': (
                    'You are a professional editor helping draft policy '
                    'and political documents. Return only the revised '
                    'paragraph text, nothing else.'
                ),
            },
            {
                'role': 'user',
                'content': f'{instruction}\n\n{current.text}',
            },
        ],
        max_tokens=1000,
    )
    return response.choices[0].message.content.strip()
