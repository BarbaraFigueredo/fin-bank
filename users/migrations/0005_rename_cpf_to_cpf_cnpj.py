import users.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_authtoken'),
    ]

    operations = [
        migrations.RenameField(
            model_name='user',
            old_name='cpf',
            new_name='cpf_cnpj',
        ),
        migrations.AlterField(
            model_name='user',
            name='cpf_cnpj',
            field=models.CharField(max_length=18, unique=True, validators=[users.validators.validate_cpf_cnpj]),
        ),
    ]
