# 🏦 API de Agendamento Bancário

Esta é uma API REST desenvolvida em **Node.js** com **Express**, utilizando o banco de dados serverless **TiDB Cloud (compatível com MySQL)**. O projeto gerencia o cadastro de clientes e o agendamento de serviços bancários com conexões seguras (SSL) e pool de conexões otimizado para produção.

---

## 🚀 Tecnologias Utilizadas

* **Node.js** (Versão 18+)
* **Express** (Roteamento e Servidor HTTP)
* **MySQL2** (Driver de banco de dados com suporte a Promises)
* **Dotenv** (Gerenciamento de variáveis de ambiente)
* **TiDB Cloud** (Banco de dados relacional distribuído em nuvem)

---

## 📦 Estrutura do Banco de Dados

A API utiliza duas tabelas relacionadas na proporção de 1 para muitos (`1:N`) dentro do TiDB Cloud:

```sql
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL
);

CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_agendamento DATE NOT NULL,
    horario TIME NOT NULL,
    servico VARCHAR(100) NOT NULL,
    descricao TEXT,
    cliente_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);