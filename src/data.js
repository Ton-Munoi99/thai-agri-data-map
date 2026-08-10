const oaeCrop = (crop) => ({ ...crop, source: 'oae-farmplus' })

const nationalCrops = [
  { id: 'cassava', label: 'มันสำปะหลังสด · ขนาดคละ', oaeProduct: 'มันสำปะหลังสด ขนาดคละ', unit: 'กิโลกรัม' },
  { id: 'coffee', label: 'กาแฟอาราบิก้า · กะลา', oaeProduct: 'กาแฟอาราบิก้า (กะลา)', unit: 'กิโลกรัม' },
  { id: 'pork', label: 'สุกร · น้ำหนักเกิน 100 กก.', oaeProduct: 'สุกร น้ำหนัก เกิน 100 กก.', unit: 'กิโลกรัม' },
  { id: 'chicken', label: 'ไก่เนื้อ · ฟาร์มประกัน', oaeProduct: 'ไก่รุ่นพันธุ์เนื้อ (ฟาร์มประกัน)', unit: 'กิโลกรัม' },
  { id: 'egg', label: 'ไข่ไก่ · ขนาดคละ', oaeProduct: 'ไข่ไก่ ขนาดคละ', unit: 'ร้อยฟอง' },
  { id: 'beef', label: 'โคเนื้อพื้นเมือง · ขนาดกลาง', oaeProduct: 'โคเนื้อพันธุ์พื้นเมือง ขนาดกลาง', unit: 'ตัว' },
  { id: 'shrimp', label: 'กุ้งขาว · 50 ตัว/กก.', oaeProduct: 'กุ้งขาวแวนนาไม ขนาด 50  ตัว/กก.', unit: 'กิโลกรัม' },
].map(oaeCrop)

// One representative market specification per fruit family. Every item below
// is currently published by OAE Farm Plus and keeps its original reporting unit.
const fruitCrops = [
  { id: 'fruit-durian', label: 'ทุเรียนหมอนทอง · ขนาดคละ', oaeProduct: 'ทุเรียนหมอนทอง ขนาดคละ', unit: 'กิโลกรัม' },
  { id: 'fruit-longan', label: 'ลำไยสดอีดอ · เกรด A', oaeProduct: 'ลำไยสดทั้งช่อพันธุ์อีดอ เกรด A', unit: 'กิโลกรัม' },
  { id: 'fruit-longkong', label: 'ลองกอง · ขนาดคละ', oaeProduct: 'ลองกอง ขนาดคละ', unit: 'กิโลกรัม' },
  { id: 'fruit-mangosteen', label: 'มังคุด · ขนาดคละ', oaeProduct: 'มังคุด ขนาดคละ', unit: 'กิโลกรัม' },
  { id: 'fruit-rambutan', label: 'เงาะโรงเรียน', oaeProduct: 'เงาะโรงเรียน ตะกร้า', unit: 'กิโลกรัม' },
  { id: 'fruit-pineapple', label: 'สับปะรดปัตตาเวีย · บริโภค', oaeProduct: 'สับปะรดปัตตาเวียบริโภค', unit: 'กิโลกรัม' },
  { id: 'fruit-pomelo', label: 'ส้มโอขาวแตงกวา', oaeProduct: 'ส้มโอขาวแตงกวา', unit: 'กิโลกรัม' },
  { id: 'fruit-mango', label: 'มะม่วงน้ำดอกไม้', oaeProduct: 'มะม่วงน้ำดอกไม้', unit: 'กิโลกรัม' },
  { id: 'fruit-coconut', label: 'มะพร้าวน้ำหอม · ขนาดคละ', oaeProduct: 'มะพร้าวน้ำหอม ขนาดคละ', unit: 'ร้อยผล' },
  { id: 'fruit-banana', label: 'กล้วยน้ำว้า · ขนาดคละ', oaeProduct: 'กล้วยน้ำว้า ขนาดคละ', unit: 'หวี' },
  { id: 'fruit-salak', label: 'สละ', oaeProduct: 'สละ', unit: 'กิโลกรัม' },
  { id: 'fruit-guava', label: 'ฝรั่งแป้นสีทอง', oaeProduct: 'ฝรั่งพันธุ์แป้นสีทอง', unit: 'กิโลกรัม' },
  { id: 'fruit-papaya', label: 'มะละกอฮอลแลนด์ · ขนาดคละ', oaeProduct: 'มะละกอฮอลแลนด์ ขนาดคละ', unit: 'กิโลกรัม' },
  { id: 'fruit-watermelon', label: 'แตงโมจินตหรา', oaeProduct: 'แตงโม พันธุ์จินตหรา', unit: 'กิโลกรัม' },
  { id: 'fruit-orange', label: 'ส้มเขียวหวานสายน้ำผึ้ง · กลาง', oaeProduct: 'ส้มเขียวหวานสายน้ำผึ้ง ขนาดกลาง', unit: 'กิโลกรัม' },
  { id: 'fruit-lime', label: 'มะนาวแป้น · ขนาดคละ', oaeProduct: 'มะนาวแป้น ขนาดคละ', unit: 'ร้อยผล' },
  { id: 'fruit-rose-apple', label: 'ชมพู่ทับทิมจันทร์', oaeProduct: 'ชมพู่ทับทิมจันทร์', unit: 'กิโลกรัม' },
  { id: 'fruit-santol', label: 'กระท้อนเปรี้ยว', oaeProduct: 'กระท้อนเปรี้ยว', unit: 'กิโลกรัม' },
  { id: 'fruit-jackfruit', label: 'ขนุนทองประเสริฐ', oaeProduct: 'ขนุนพันธุ์ทองประเสริฐ', unit: 'กิโลกรัม' },
  { id: 'fruit-grape', label: 'องุ่นคาร์ดินัล', oaeProduct: 'องุ่น คาร์ดินัล', unit: 'กิโลกรัม' },
].map((fruit) => oaeCrop({ ...fruit, category: 'fruit' }))

export const cropGroups = [
  { label: 'ผลไม้ · OAE Farm Plus', items: fruitCrops },
  { label: 'สินค้าเกษตรอื่น · OAE Farm Plus', items: nationalCrops },
]

export const crops = cropGroups.flatMap((group) => group.items)

export const provinceNames = {
  Bangkok: 'กรุงเทพมหานคร', 'Samut Prakan': 'สมุทรปราการ', Nonthaburi: 'นนทบุรี', 'Pathum Thani': 'ปทุมธานี',
  'Phra Nakhon Si Ayutthaya': 'พระนครศรีอยุธยา', 'Ang Thong': 'อ่างทอง', 'Lop Buri': 'ลพบุรี', 'Sing Buri': 'สิงห์บุรี',
  'Chai Nat': 'ชัยนาท', Saraburi: 'สระบุรี', 'Chon Buri': 'ชลบุรี', Rayong: 'ระยอง', Chanthaburi: 'จันทบุรี',
  Trat: 'ตราด', Chachoengsao: 'ฉะเชิงเทรา', 'Prachin Buri': 'ปราจีนบุรี', 'Nakhon Nayok': 'นครนายก',
  'Sa Kaeo': 'สระแก้ว', 'Nakhon Ratchasima': 'นครราชสีมา', Buriram: 'บุรีรัมย์', Surin: 'สุรินทร์',
  'Si Sa Ket': 'ศรีสะเกษ', 'Ubon Ratchathani': 'อุบลราชธานี', Yasothon: 'ยโสธร', 'Chaiyaphum': 'ชัยภูมิ',
  'Amnat Charoen': 'อำนาจเจริญ', 'Bueng Kan': 'บึงกาฬ', 'Nong Bua Lam Phu': 'หนองบัวลำภู', 'Khon Kaen': 'ขอนแก่น',
  'Udon Thani': 'อุดรธานี', Loei: 'เลย', 'Nong Khai': 'หนองคาย', 'Maha Sarakham': 'มหาสารคาม',
  'Roi Et': 'ร้อยเอ็ด', 'Kalasin': 'กาฬสินธุ์', 'Sakon Nakhon': 'สกลนคร', 'Nakhon Phanom': 'นครพนม',
  Mukdahan: 'มุกดาหาร', 'Chiang Mai': 'เชียงใหม่', 'Lamphun': 'ลำพูน', Lampang: 'ลำปาง', Uttaradit: 'อุตรดิตถ์',
  Phrae: 'แพร่', Nan: 'น่าน', Phayao: 'พะเยา', 'Chiang Rai': 'เชียงราย', 'Mae Hong Son': 'แม่ฮ่องสอน',
  'Nakhon Sawan': 'นครสวรรค์', 'Uthai Thani': 'อุทัยธานี', 'Kamphaeng Phet': 'กำแพงเพชร', Tak: 'ตาก',
  Sukhothai: 'สุโขทัย', Phitsanulok: 'พิษณุโลก', Phichit: 'พิจิตร', Phetchabun: 'เพชรบูรณ์',
  Ratchaburi: 'ราชบุรี', Kanchanaburi: 'กาญจนบุรี', 'Suphan Buri': 'สุพรรณบุรี', 'Samut Songkhram': 'สมุทรสงคราม',
  Phetchaburi: 'เพชรบุรี', 'Prachuap Khiri Khan': 'ประจวบคีรีขันธ์', 'Nakhon Pathom': 'นครปฐม', 'Samut Sakhon': 'สมุทรสาคร',
  'Nakhon Si Thammarat': 'นครศรีธรรมราช', Krabi: 'กระบี่', Phangnga: 'พังงา', Phuket: 'ภูเก็ต', 'Surat Thani': 'สุราษฎร์ธานี',
  Ranong: 'ระนอง', Chumphon: 'ชุมพร', Songkhla: 'สงขลา', Satun: 'สตูล', Trang: 'ตรัง', Phatthalung: 'พัทลุง',
  Pattani: 'ปัตตานี', Yala: 'ยะลา', Narathiwat: 'นราธิวาส',
}

export const anchorCoordinates = {
  Kanchanaburi: { lat: 14.02, lon: 99.53 }, Bangkok: { lat: 13.7563, lon: 100.5018 },
  Trat: { lat: 12.2428, lon: 102.5175 },
  'Chiang Mai': { lat: 18.7883, lon: 98.9853 }, 'Chiang Rai': { lat: 19.9105, lon: 99.8406 },
  'Khon Kaen': { lat: 16.4322, lon: 102.8236 }, 'Nakhon Ratchasima': { lat: 14.9799, lon: 102.0978 },
  'Ubon Ratchathani': { lat: 15.2448, lon: 104.8473 }, 'Chon Buri': { lat: 13.3611, lon: 100.9847 },
  'Surat Thani': { lat: 9.1382, lon: 99.3215 }, Songkhla: { lat: 7.1898, lon: 100.5954 }, Phuket: { lat: 7.8804, lon: 98.3923 },
}

export const climatePeriods = [
  { id: '1991-2020', start: 1991, end: 2020, label: 'พ.ศ. 2534–2563' },
  { id: '2001-2020', start: 2001, end: 2020, label: 'พ.ศ. 2544–2563' },
  { id: '2011-2020', start: 2011, end: 2020, label: 'พ.ศ. 2554–2563' },
  { id: '1991-2010', start: 1991, end: 2010, label: 'พ.ศ. 2534–2553' },
]

export const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
export const nasaMonthKeys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export const fallbackPrice = [
  { period: '2567/9', value: 2.31 }, { period: '2567/10', value: 2.26 }, { period: '2567/11', value: 2.31 },
  { period: '2567/12', value: 2.27 }, { period: '2568/1', value: 2.18 }, { period: '2568/2', value: 2.14 },
  { period: '2568/3', value: 2.05 }, { period: '2568/4', value: 1.96 }, { period: '2568/5', value: 1.87 },
  { period: '2568/6', value: 1.83 }, { period: '2568/7', value: 1.77 }, { period: '2568/8', value: 1.68 },
]

export const fallbackWeather = {
  temperature: 28.4, apparent: 33.1, humidity: 78, wind: 8.6, rain: 3.2, soil: 0.28, et0: 4.1,
  min: 24.6, max: 32.8, forecast: monthLabels.slice(0, 7).map((name, i) => ({ name, rain: [1, 3, 7, 4, 9, 5, 2][i] })),
}

export const fallbackClimate = monthLabels.map((name, i) => ({
  name,
  rain: [0.29, 0.36, 1.22, 2.16, 4.61, 4.84, 5.89, 5.75, 7.14, 6.31, 1.25, 0.22][i],
  temp: [24.57, 27.03, 29.29, 30.3, 28.55, 27.19, 26.51, 26.21, 26.04, 25.5, 24.28, 23.13][i],
}))
