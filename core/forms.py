from django import forms
from .models import Document


class DocumentForm(forms.ModelForm):
    initial_content = forms.CharField(
        required=False,
        label='Paste existing content (optional)',
        widget=forms.Textarea(attrs={
            'class': (
                'w-full bg-gray-800 border border-gray-700 text-gray-100 '
                'rounded px-3 py-2 font-mono text-sm'
            ),
            'rows': 12,
            'placeholder': (
                'Paste your document here — each paragraph (separated by a '
                'blank line) will become its own block.'
            ),
        }),
    )

    class Meta:
        model = Document
        fields = ['title', 'description']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': (
                    'w-full bg-gray-800 border border-gray-700 text-gray-100 '
                    'rounded px-3 py-2'
                ),
                'placeholder': 'Document title',
                'autofocus': True,
            }),
            'description': forms.Textarea(attrs={
                'class': (
                    'w-full bg-gray-800 border border-gray-700 text-gray-100 '
                    'rounded px-3 py-2'
                ),
                'rows': 3,
                'placeholder': 'Optional description',
            }),
        }


class BlockTextForm(forms.Form):
    text = forms.CharField(
        widget=forms.HiddenInput(),
        required=False,
    )


class SuggestForm(forms.Form):
    suggestion_type = forms.ChoiceField(
        choices=[
            ('rewrite', 'Rewrite'),
            ('improve', 'Improve'),
            ('shorten', 'Shorten'),
            ('expand', 'Expand'),
        ]
    )


class SnapshotExportForm(forms.Form):
    github_repo = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={
            'placeholder': 'owner/repo',
            'class': 'border rounded px-2 py-1 text-sm',
        }),
    )
    github_token = forms.CharField(
        max_length=200,
        required=False,
        widget=forms.PasswordInput(attrs={
            'placeholder': 'ghp_... (leave blank to use env var)',
            'class': 'border rounded px-2 py-1 text-sm',
        }),
    )
