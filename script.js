document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log("Formulário enviado! Disparando requisição...");

    try {
        const response = await fetch('https://cat-plan.onrender.com/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // 1. Salva o nome do usuário logado
            localStorage.setItem('usuarioLogado', username);

            // 2. Se a conta já possui dados salvos no Supabase, atualiza o navegador
            if (data.dados) {
                localStorage.setItem('catPlanDados', JSON.stringify(data.dados));
            }

            alert("Miau! Bem-vindo ao Cat-Plan!");
            window.location.href = "dashboard.html"; // Redireciona para o painel
        } else {
            alert(data.mensagem || "Erro ao entrar.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão com o servidor.");
    }
});
