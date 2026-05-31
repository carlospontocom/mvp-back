import pool from '../config/database.js';

// ==========================================
// CREATE
// ==========================================

export async function criarAgendamento(data_agendamento, horario, servico, descricao, cliente_id) {
  const [result] = await pool.query(
    'INSERT INTO agendamentos (data_agendamento, horario, servico, descricao, cliente_id) VALUES (?, ?, ?, ?, ?)',
    [data_agendamento, horario, servico, descricao, cliente_id]
  );
  return result.insertId;
}

// ==========================================
// READ
// ==========================================

export async function buscarTodosAgendamentos() {
  const querySql = `
    SELECT 
      a.id,
      a.data_agendamento,
      a.horario,
      a.servico,
      a.descricao,
      c.nome  AS cliente_nome,
      c.email AS cliente_email
    FROM agendamentos a
    INNER JOIN clientes c ON a.cliente_id = c.id
    ORDER BY a.data_agendamento ASC, a.horario ASC
  `;
  const [rows] = await pool.query(querySql);
  return rows;
}

export async function buscarAgendamentosPorNome(nome) {
  const querySql = `
    SELECT 
      a.id,
      a.data_agendamento,
      a.horario,
      a.servico,
      a.descricao,
      c.nome  AS cliente_nome,
      c.email AS cliente_email
    FROM agendamentos a
    INNER JOIN clientes c ON a.cliente_id = c.id
    WHERE c.nome LIKE ?
    ORDER BY a.data_agendamento ASC, a.horario ASC
  `;
  const [rows] = await pool.query(querySql, [`%${nome}%`]);
  return rows;
}

export async function buscarAgendamentosPorData(data) {
  const querySql = `
    SELECT 
      a.id,
      a.data_agendamento,
      a.horario,
      a.servico,
      a.descricao,
      c.nome  AS cliente_nome,
      c.email AS cliente_email
    FROM agendamentos a
    INNER JOIN clientes c ON a.cliente_id = c.id
    WHERE a.data_agendamento = ?
    ORDER BY a.horario ASC
  `;
  const [rows] = await pool.query(querySql, [data]);
  return rows;
}

// ==========================================
// UPDATE
// ==========================================

export async function atualizarAgendamento(id, data_agendamento, horario, servico, descricao) {
  const [result] = await pool.query(
    `UPDATE agendamentos
     SET data_agendamento = ?, horario = ?, servico = ?, descricao = ?
     WHERE id = ?`,
    [data_agendamento, horario, servico, descricao, id]
  );
  return result.affectedRows > 0;
}

// ==========================================
// DELETE
// ==========================================

export async function deletarAgendamento(id) {
  const [result] = await pool.query(
    'DELETE FROM agendamentos WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}