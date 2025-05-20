users = ['operator', 'admin']
passwords = ['123456', 'admin']

def check_user(username, password):
    if username in users and password in passwords:
        user_index = users.index(username)
        pass_index = passwords.index(password)

        if user_index == pass_index:
            return 'admin' if username == 'admin' else 'operator'
    else:
        return False