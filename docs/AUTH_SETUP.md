# Configuração do Administrador Inicial

Use este procedimento somente no projeto Supabase vinculado a este repositorio.

## Como criar o primeiro usuário

1. Acesse `https://app.supabase.com/`.
2. Selecione o projeto correto deste ambiente.
3. Abra `Authentication`.
4. Clique em `Add User` > `Create new user`.
5. Preencha e-mail e senha.
6. Se quiser ativação imediata, desmarque o envio de convite por e-mail.
7. Confirme a criação.

## Acesso local

- URL local: `http://localhost:8080/crm/login`
- Use as credenciais criadas no projeto selecionado.

## Regras de seguranca

- Nao reutilize `Site URL`, `Redirect URLs` ou templates de e-mail de outro ambiente.
- Valide se os callbacks do Supabase Auth apontam apenas para os dominios esperados deste deploy.
- Revise os papeis e permissões do usuário criado antes de liberar o acesso operacional.
