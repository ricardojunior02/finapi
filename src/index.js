const express = require('express');
const { v4: uuid } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

function verifyAccount(request, response, next){
  const { cpf } = request.params;

  const customer = customers.find(customer => customer.cpf === cpf);

  if(!customer){
    return response.status(400).json({ error: 'Customer not found' })
  }

  request.customer = customer;

  return next();
}

function getBalance(statement){
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit'){
      return acc + operation.amount;
    }else{
      return acc - operation.amount;
    }
  }, 0);
  console.log("BALANCE", balance)
  return balance;
}

app.post('/customer', (request, response) => {
  const { name, cpf } = request.body;

  customers.push({
    name,
    cpf,
    id: uuid(),
    statement: []
  });

  return response.status(200).send();
});


app.get('/statement/:cpf', verifyAccount, (request, response) => {
  return response.json(request.customer.statement);
});

app.post('/deposit/:cpf', verifyAccount, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperaion = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  }

  customer.statement.push(statementOperaion);

  return response.status(201).send();
});


app.post('/withdraw/:cpf', verifyAccount, (request, response) => {
  const { amount } = request.body;

  const { customer } = request;

  const balance = getBalance(customer.statement);

  if(balance < amount){
    return response.status(401).json({ error: 'Insufficient founds!'})
  }

  const statementOperaion = {
    amount,
    created_at: new Date(),
    type: 'debit',
  }

  customer.statement.push(statementOperaion);

  return response.status(201).send();
});

app.get('/statement/date/:cpf', verifyAccount, (request, response) => {
  const { date } = request.query;
  const { customer } = request;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(statement => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(statement);
});

app.put('/account/:cpf', verifyAccount, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(200).json(customer);
});

app.get('/account/:cpf', verifyAccount, (request, response) => {
  return response.status(200).json(request.customer)
});

app.delete('/account/:cpf', verifyAccount, (request, response) => {
  const { customer } = request;

  const index = customers.findIndex(index => index.cpf === customer.cpf);

  customers.splice(index, 1);

  return response.status(200).json(customers);
});


app.get('/balance/:cpf', verifyAccount, (request, response) => {
  const balance = getBalance(request.customer.statement)
  return response.status(200).json(balance)
})


app.listen(3333, () => console.log('Server running...'))