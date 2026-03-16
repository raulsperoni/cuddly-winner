from django import forms
from .models import Document


class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['title', 'description']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'w-full border rounded px-3 py-2',
                'placeholder': 'Document title',
                'autofocus': True,
            }),
            'description': forms.Textarea(attrs={
                'class': 'w-full border rounded px-3 py-2',
                'rows': 3,
                'placeholder': 'Optional description',
            }),
        }


class BlockTextForm(forms.Form):
    text = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'w-full border rounded px-3 py-2 font-mono',
            'rows': 5,
        }),
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
