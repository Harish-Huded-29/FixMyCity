// backend/routes/locationRoutes.js
// Serves location data (states, districts, cities) for the 5 supported states
const express = require('express');
const router = express.Router();

const LOCATION_DATA = {
  Karnataka: {
    Bengaluru: ['Bengaluru Urban', 'Bengaluru Rural', 'Yelahanka', 'Whitefield', 'Electronic City', 'Jayanagar', 'Indiranagar'],
    Belagavi: ['Belagavi City', 'Dharwad', 'Hubballi', 'Gadag', 'Bagalkot'],
    Mysuru: ['Mysuru City', 'Mandya', 'Chamarajanagar', 'Hassan'],
    Mangaluru: ['Mangaluru City', 'Udupi', 'Puttur', 'Bantwal'],
    Kalaburagi: ['Kalaburagi City', 'Bidar', 'Raichur', 'Yadgir', 'Koppal'],
    Shivamogga: ['Shivamogga City', 'Davanagere', 'Chikkamagaluru', 'Chitradurga'],
    Tumakuru: ['Tumakuru City', 'Kolar', 'Chikkaballapura', 'Ramanagara'],
    Vijayapura: ['Vijayapura City', 'Haveri', 'Dharwad'],
  },
  Maharashtra: {
    Mumbai: ['Mumbai City', 'Mumbai Suburban', 'Bandra', 'Andheri', 'Borivali', 'Dadar', 'Kurla', 'Chembur'],
    Pune: ['Pune City', 'Pimpri-Chinchwad', 'Hadapsar', 'Kothrud', 'Hinjewadi', 'Wakad'],
    Nagpur: ['Nagpur City', 'Kamptee', 'Butibori', 'Hingna'],
    Nashik: ['Nashik City', 'Deolali', 'Sinnar', 'Igatpuri'],
    Aurangabad: ['Aurangabad City', 'Jalna', 'Osmanabad'],
    Solapur: ['Solapur City', 'Pandharpur', 'Barshi'],
    Kolhapur: ['Kolhapur City', 'Sangli', 'Satara', 'Miraj'],
    Thane: ['Thane City', 'Navi Mumbai', 'Kalyan', 'Dombivli', 'Ulhasnagar', 'Mira-Bhayandar'],
    Amravati: ['Amravati City', 'Akola', 'Buldhana', 'Yavatmal', 'Wardha'],
  },
  Kerala: {
    Thiruvananthapuram: ['Thiruvananthapuram City', 'Nedumangad', 'Varkala', 'Attingal'],
    Ernakulam: ['Kochi City', 'Aluva', 'Angamaly', 'Perumbavoor', 'Muvattupuzha'],
    Kozhikode: ['Kozhikode City', 'Vadakara', 'Koyilandy', 'Ramanattukara'],
    Thrissur: ['Thrissur City', 'Irinjalakuda', 'Chalakudy', 'Guruvayur'],
    Kollam: ['Kollam City', 'Kottarakkara', 'Punalur', 'Paravur'],
    Alappuzha: ['Alappuzha City', 'Cherthala', 'Kayamkulam', 'Chengannur'],
    Palakkad: ['Palakkad City', 'Ottapalam', 'Shornur', 'Mannarkkad'],
    Kannur: ['Kannur City', 'Thalassery', 'Iritty', 'Payyanur'],
    Malappuram: ['Malappuram City', 'Tirur', 'Perinthalmanna', 'Manjeri'],
    Kottayam: ['Kottayam City', 'Pala', 'Changanacherry', 'Vaikom'],
  },
  'Tamil Nadu': {
    Chennai: ['Chennai City', 'Tambaram', 'Avadi', 'Ambattur', 'Porur', 'Velachery', 'Adyar', 'Anna Nagar'],
    Coimbatore: ['Coimbatore City', 'Tiruppur', 'Pollachi', 'Mettupalayam'],
    Madurai: ['Madurai City', 'Dindigul', 'Sivaganga', 'Ramanathapuram'],
    Tiruchirappalli: ['Tiruchirappalli City', 'Thanjavur', 'Kumbakonam', 'Nagapattinam'],
    Salem: ['Salem City', 'Namakkal', 'Dharmapuri', 'Krishnagiri'],
    Tirunelveli: ['Tirunelveli City', 'Thoothukudi', 'Nagercoil', 'Tenkasi'],
    Vellore: ['Vellore City', 'Ranipet', 'Tirupattur', 'Ambur'],
    Erode: ['Erode City', 'Gobichettipalayam', 'Bhavani'],
    'Kancheepuram': ['Kancheepuram City', 'Chengalpattu', 'Maraimalai Nagar'],
  },
  Goa: {
    'North Goa': ['Panaji', 'Mapusa', 'Calangute', 'Candolim', 'Pernem', 'Bicholim', 'Ponda'],
    'South Goa': ['Margao', 'Vasco da Gama', 'Mormugao', 'Sanvordem', 'Quepem', 'Canacona'],
  },
};

// GET /api/location/states
router.get('/states', (req, res) => {
  res.json({ success: true, states: Object.keys(LOCATION_DATA) });
});

// GET /api/location/districts?state=Karnataka
router.get('/districts', (req, res) => {
  const { state } = req.query;
  if (!state || !LOCATION_DATA[state]) {
    return res.status(400).json({ success: false, message: 'Invalid or missing state' });
  }
  res.json({ success: true, districts: Object.keys(LOCATION_DATA[state]) });
});

// GET /api/location/cities?state=Karnataka&district=Belagavi
router.get('/cities', (req, res) => {
  const { state, district } = req.query;
  if (!state || !district || !LOCATION_DATA[state] || !LOCATION_DATA[state][district]) {
    return res.status(400).json({ success: false, message: 'Invalid state or district' });
  }
  res.json({ success: true, cities: LOCATION_DATA[state][district] });
});

// GET /api/location/all — full data for frontend dropdowns
router.get('/all', (req, res) => {
  res.json({ success: true, data: LOCATION_DATA });
});

module.exports = router;
