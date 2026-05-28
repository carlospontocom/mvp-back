import pool from '../config/database.js';
import bcrypt from 'bcrypt';

// 1. Criar novo cliente (INSERT) - Agora com senha criptografada
export async function criarCliente(nome, email, senha, data_nascimento) {
  const senhaCriptografada = await bcrypt.hash(senha, 10);

  const [result] = await pool.query(
    'INSERT INTO clientes (nome, email, senha, data_nascimento) VALUES (?, ?, ?, ?)',
    [nome, email, senhaCriptografada, data_nascimento]
  );
  return result.insertId; // Retorna o ID do cliente recém-criado
}

// 2. Buscar todos os clientes (Não traz a senha por segurança)
export async function buscarTodosClientes() {
  const [rows] = await pool.query('SELECT id, nome, email, data_nascimento FROM clientes');
  return rows;
}

// 3. Buscar cliente por Email (Traz o ID e a SENHA para o processo de login funcionar!)
export async function buscarClienteEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, nome, email, senha, data_nascimento FROM clientes WHERE email = ?', 
    [email]
  );
  return rows[0]; 
}

// 4. Buscar clientes por Nome (Busca parcial - Omitindo a senha)
export async function buscarClienteNome(nome) {
  const [rows] = await pool.query(
    'SELECT id, nome, email, data_nascimento FROM clientes WHERE nome LIKE ?', 
    [`%${nome}%`]
  );
  return rows;
}

// 5. Atualizar Cliente (Criptografa a nova senha se ela for alterada)
export async function atualizarCliente(id, nome, email, senha, data_nascimento) {
  // Criptografa a nova senha antes do UPDATE
  const novaSenhaCriptografada = await bcrypt.hash(senha, 10);

  const [result] = await pool.query(
    'UPDATE clientes SET nome = ?, email = ?, senha = ?, data_nascimento = ? WHERE id = ?', 
    [nome, email, novaSenhaCriptografada, data_nascimento, id]
  );
  return result.affectedRows > 0;
}

// 6. Deletar Cliente por ID
export async function deletarCliente(id) {
  const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
  return result.affectedRows > 0;
}