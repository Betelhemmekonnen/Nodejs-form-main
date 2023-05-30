
const mysql = require('mysql');
const request = require('supertest');
const app = require('../app');
const express = require('express');
const cheerio = require('cheerio');
// Configure MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'logindb',
});

describe('Test the database queries', () => {
  let id;

  beforeAll((done) => {
    connection.connect((err) => {
      if (err) throw err;
      console.log('Connected to My logindb database');
      done();
    });
  });

  afterAll((done) => {
    connection.end((err) => {
      if (err) throw err;
      console.log('Disconected from logindb database');
      done();
    });
  });

  
  describe('POST /auth/register', () => {
  test('should insert a new user into the database', async() => {
    const users = { username: 'testuser',email:"testuser@gmail.com", password: 'TESTpassword123!' };
     await connection.query('INSERT INTO user SET ?', users, (err, results) => {
      if (err) throw err;
      id= results.insertId;
      expect(results.affectedRows).toBe(1);
    });
  });
  it('should not register a user with taken email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
      name: 'testuser',
      email: 'testuser@gmail.com',
      password: 'TESTpassword123!',
      password_confirm:'TESTpassword123!',
      });
    expect(res.statusCode).toEqual(200);
    
    // Parse the HTML response using Cheerio
    const $ = cheerio.load(res.text);
    const error = $('h4.alert.alert-danger').text();
    expect(error).toEqual("This email is already in use");
    });
  it('should not register a user with invalid passwords', async () => {
	const res = await request(app)
	  .post('/auth/register')
	  .send({
		name: 'John Doe',
		email: 'meri@example.com',
		password: 'sword1234',
    
	  });
	expect(res.statusCode).toEqual(200);
  
	// Parse the HTML response using Cheerio
	const $ = cheerio.load(res.text);
	const error = $('h4.alert.alert-danger').text();
  
	expect(error).toEqual("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
  });

  it('should not register a user with mismatching passwords', async () => {
	const res = await request(app)
	  .post('/auth/register')
	  .send({
		name: 'John Doe',
		email: 'hn@example.com',
		password: 'PASsword1234$',
		password_confirm: 'Ssword1234$'
	  });
	expect(res.statusCode).toEqual(200);
  
	// Parse the HTML response using Cheerio
	const $ = cheerio.load(res.text);
	const error = $('h4.alert.alert-danger').text();
  
	expect(error).toEqual("Password Didn't Match!");
  });
  
  })
    
  describe('/login', () => {
    test('returns 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: '', password: '' });
  
      expect(response.status).toBe(400);
    });
  
    test('returns 401 if user does not exist', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'nonexistent@example.com', password: 'password' });
  
      expect(response.status).toBe(401);
    });
  
    test('returns 401 if password is incorrect', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'testuser@gmail.com', password: 'wrongpassword' });
  
      expect(response.status).toBe(401);
    });
  
    test('redirects to/welome if login is successful', async () => {
      const response = await request(app)
        .post('/login')
      .send({ email: 'testuser@gmail', password: 'TESTpassword123!' });
  
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/welcome');
    });

  });
it('should delete the created user from the database', async() => {
    await connection.query('DELETE FROM user WHERE id = ?', [id], (err, results) => {
      if (err) throw err;
      expect(results.affectedRows).toBe(1);
    });
  });
})
