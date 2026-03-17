import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


def populate_invite_tokens(apps, schema_editor):
    Document = apps.get_model('core', 'Document')
    for document in Document.objects.filter(invite_token__isnull=True):
        document.invite_token = uuid.uuid4()
        document.save(update_fields=['invite_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='invite_token',
            field=models.UUIDField(null=True),
        ),
        migrations.RunPython(
            populate_invite_tokens,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='document',
            name='invite_token',
            field=models.UUIDField(default=uuid.uuid4, unique=True),
        ),
        migrations.CreateModel(
            name='DocumentMembership',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'role',
                    models.CharField(
                        choices=[('collaborator', 'Collaborator')],
                        default='collaborator',
                        max_length=20,
                    ),
                ),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                (
                    'document',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='memberships',
                        to='core.document',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='document_memberships',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'unique_together': {('document', 'user')},
            },
        ),
    ]
