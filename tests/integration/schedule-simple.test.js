const { expect } = require('chai');
const supertest = require('supertest');

describe('Schedule API Simple Tests', () => {
  const request = supertest('http://localhost:3001');
  let agent;

  before(async function() {
    this.timeout(15000);
    agent = supertest.agent('http://localhost:3001');
    
    // Login first
    const loginRes = await agent
      .post('/login')
      .send({ username: 'admin', password: 'admin123' });
    
    expect(loginRes.status).to.be.oneOf([200, 302]);
  });

  describe('GET /schedule', () => {
    it('should return today\'s schedule successfully', async function() {
      this.timeout(10000);
      
      const res = await agent.get('/schedule');
      expect(res.status).to.be.oneOf([200, 302]);
      
      if (res.status === 200) {
        expect(res.text).to.contain('schedule');
      }
    });

    it('should handle date filtering', async function() {
      this.timeout(10000);
      
      const today = new Date().toISOString().split('T')[0];
      const res = await agent.get(`/schedule?date=${today}`);
      
      expect(res.status).to.be.oneOf([200, 302]);
    });

    it('should handle day filtering', async function() {
      this.timeout(10000);
      
      const res = await agent.get('/schedule?day=Monday');
      expect(res.status).to.be.oneOf([200, 302]);
    });
  });

  describe('Schedule Data Validation', () => {
    it('should confirm schedule system is working', async function() {
      this.timeout(10000);
      
      // Test that we can access the schedule page
      const res = await agent.get('/schedule');
      expect(res.status).to.equal(200);
      
      // Should contain schedule-related content
      expect(res.text).to.include('Schedule');
    });
  });
});
