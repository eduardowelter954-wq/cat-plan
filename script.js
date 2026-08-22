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
            alert("Miau! Bem-vindo ao Cat-Plan!");
            // Redireciona ou faz algo após o sucesso
            window.location.href = "dashboard.html"; // ou a sua página principal
        } else {
            alert(data.mensagem || "Erro ao entrar.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão com o servidor.");
    }
});
