# TODO: Implement Risk Investment Dashboard

## Backend Changes
- [x] Add Stock model to flask-jwt-auth/app/models.py with fields: id, symbol, name, price, change, changePercent, volume, marketCap, riskScore
- [x] Update flask-jwt-auth/app/auth.py to modify /auth/stocks endpoint to query Stock table instead of mock data
- [x] Add sample data insertion for risk investment companies in auth.py

## Frontend Changes
- [x] Update src/pages/Dashboard.jsx to add a new bar chart for "Risk Scores of Investment Companies"
- [x] Enhance dashboard attractiveness with better styling for risk indicators

## Followup Steps
- [ ] Run database migrations to create Stock table
- [ ] Populate database with sample risk investment company data
- [ ] Test the updated dashboard to ensure data fetches correctly and charts display properly
