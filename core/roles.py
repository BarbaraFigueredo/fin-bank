from rolepermissions.roles import AbstractUserRole


class People(AbstractUserRole):
    available_permissions = {
        "make_transfer": True,
        "receive_transfer": True,
        "make_transaction": True,
        "receive_transaction": True,
    }


class Company(AbstractUserRole):
    available_permissions = {
        "make_transfer": False,
        "receive_transfer": True,
        "make_transaction": False,
        "receive_transaction": True,
    }