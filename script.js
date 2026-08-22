const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

app.get('/', (req, res) => {
    res.send('Servidor do Cat-Plan conectado ao Supabase! 🐈‍⬛');
});

app.post('/api/auth', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ mensagem: "Usuário e senha são obrigatórios!" });
    }

    try {
        console.log(`Buscando usuário no Supabase: ${username}`);
        
        // Usamos .maybeSingle() em vez de .single() para não dar erro se o usuário não existir
        const { data: usuarioExistente, error: erroBusca } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (erroBusca) {
            console.error('Erro ao buscar no Supabase:', erroBusca);
            return res.status(500).json({ mensagem: "Erro ao consultar banco de dados." });
        }

        if (usuarioExistente) {
            if (usuarioExistente.password === password) {
                console.log(`Login bem-sucedido para: ${username}`);
                return res.json({ mensagem: "Login realizado com sucesso!", status: "ok" });
            } else {
                return res.status(401).json({ mensagem: "Senha incorreta!" });
            }
        } else {
            console.log(`Usuário não encontrado. Criando novo cadastro para: ${username}`);
            
            const { error: erroInsercao } = await supabase
                .from('usuarios')
                .insert([{ username, password }]);

            if (erroInsercao) {
                console.error('Erro ao inserir no Supabase:', erroInsercao);
                return res.status(500).json({ mensagem: "Erro ao salvar novo usuário." });
            }

            console.log(`Novo usuário cadastrado com sucesso: ${username}`);
            return res.json({ mensagem: "Cadastro realizado com sucesso!", status: "ok" });
        }
    } catch (error) {
        console.error('Erro crítico no servidor:', error);
        res.status(500).json({ mensagem: "Erro interno no servidor." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}! 🐈‍⬛`);
});
