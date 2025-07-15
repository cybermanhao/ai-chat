import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';

async function testEcho() {
  const res = await axios.post(BASE_URL, {
    tool: 'echo',
    text: 'Hello MCP!'
  });
  console.log('echo result:', res.data);
}

async function testAdd() {
  const res = await axios.post(BASE_URL, {
    tool: 'add',
    a: 3,
    b: 5
  });
  console.log('add result:', res.data);
}

async function runTests() {
  await testEcho();
  await testAdd();
}

runTests().catch(console.error);
