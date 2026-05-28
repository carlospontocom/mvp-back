import pool from '../config/database.js';

// Criar um novo agendamento bancário
export async function criarAgendamento(data_agendamento, horario, servico, descricao, cliente_id) {
  const [result] = await pool.query(
    'INSERT INTO agendamentos (data_agendamento, horario, servico, descricao, cliente_id) VALUES (?, ?, ?, ?, ?)',
    [data_agendamento, horario, servico, descricao, cliente_id]
  );
  return result.insertId;
}

// NOVO: Buscar todos os agendamentos trazendo os dados básicos do cliente junto
export async function buscarTodosAgendamentos() {
  const querySql = `
    SELECT 
      a.id, 
      a.data_agendamento, 
      a.horario, 
      a.servico, 
      a.descricao,
      c.nome AS cliente_nome,
      c.email AS cliente_email
    FROM agendamentos a
    INNER JOIN clientes c ON a.cliente_id = c.id
    ORDER BY a.data_agendamento ASC, a.horario ASC
  `;
  
  const [rows] = await pool.query(querySql);
  return rows;
}