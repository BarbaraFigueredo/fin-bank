from django.db import models
from decimal import Decimal
from users.models import User

# Create your models here.
class Transactions(models.Model):
    amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'), editable=False)
    payer = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='payer_user', editable=False)
    payee = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='payee_user', editable=False)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'from {self.payer.first_name} to {self.payee.first_name} - R$ {self.amount} - Date: {self.date}'