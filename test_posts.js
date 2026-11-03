async function testPosts() {
  const db = require('./db');
  const initialBalance = db.getStudent('CT193667').balance;
  console.log('Initial balance:', initialBalance);
  const cookie = 'cap_user=CT193667';

  // 1. Test Topup
  const topupRes = await fetch('http://localhost:3000/Finance/Topup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie },
    body: new URLSearchParams({ amount: '500000', method: 'Ví MoMo' }),
    redirect: 'manual'
  });
  console.log('Topup status:', topupRes.status, 'New balance:', db.getStudent('CT193667').balance);

  // 2. Test Pay Cart Item
  const cart = db.getShoppingCart('CT193667');
  if (cart.length > 0) {
    const payRes = await fetch('http://localhost:3000/ShoppingCart/Pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie },
      body: new URLSearchParams({ item_id: cart[0].id }),
      redirect: 'manual'
    });
    console.log('Pay cart item status:', payRes.status);
  }

  // 3. Test Wishlist
  const wishRes = await fetch('http://localhost:3000/Wishlist/Register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie },
    body: new URLSearchParams({
      subject_code: 'PRN211',
      semester_code: 'Spring2027',
      desired_slot: 'Slot 1, 2 thứ 3, 5',
      note: 'Đăng ký học vượt'
    }),
    redirect: 'manual'
  });
  console.log('Wishlist submit status:', wishRes.status);

  // 4. Test StudentProfile Update
  const profRes = await fetch('http://localhost:3000/StudentProfile/Update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie },
    body: new URLSearchParams({
      phone: '0988776655',
      address: 'Hà Nội, Việt Nam (Updated)',
      gender: 'Nam',
      dob: '2005-08-15'
    }),
    redirect: 'manual'
  });
  console.log('Profile update status:', profRes.status, 'Phone in DB:', db.getStudent('CT193667').phone);

  console.log('All POST interactions tested successfully!');
}

testPosts();
