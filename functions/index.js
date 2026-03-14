const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Iyzipay = require('iyzipay');
const nodemailer = require('nodemailer');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

const cfg = functions.config();
const adminEmail = cfg.formalola?.admin_email || 'firat3306ogur@gmail.com';
const recaptchaSecret = cfg.recaptcha?.secret || 'YOUR_RECAPTCHA_SECRET_KEY';

const iyzipay = new Iyzipay({
  apiKey: cfg.iyzico?.api_key || 'YOUR_IYZICO_API_KEY',
  secretKey: cfg.iyzico?.secret_key || 'YOUR_IYZICO_SECRET_KEY',
  uri: cfg.iyzico?.uri || 'https://sandbox-api.iyzipay.com'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: cfg.mail?.user || 'YOUR_GMAIL_ADDRESS',
    pass: cfg.mail?.app_password || 'YOUR_GMAIL_APP_PASSWORD'
  }
});

function requireAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }
}

async function requireAdmin(context) {
  requireAuth(context);
  if (context.auth.token.admin === true) return;
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Yetkisiz erişim.');
  }
}

exports.sendContactMessage = functions.https.onCall(async (data) => {
  const { name, email, subject, message, recaptchaToken } = data || {};
  if (!name || !email || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Eksik alanlar var.');
  }

  if (recaptchaToken && !String(recaptchaSecret).includes('YOUR_')) {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;
    const verifyRes = await axios.post(verifyUrl);
    if (!verifyRes.data.success || (typeof verifyRes.data.score === 'number' && verifyRes.data.score < 0.5)) {
      throw new functions.https.HttpsError('permission-denied', 'Bot algılandı.');
    }
  }

  await db.collection('contact_messages').add({
    name,
    email,
    subject: subject || 'Genel Soru',
    message,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  if (!String(cfg.mail?.user || '').includes('YOUR_')) {
    await transporter.sendMail({
      from: `formaLOLA Bildirim <${cfg.mail.user}>`,
      to: adminEmail,
      subject: `Yeni İletişim Mesajı: ${name}`,
      text: `Kimden: ${name} (${email})\nKonu: ${subject || 'Genel Soru'}\n\n${message}`
    });
  }

  return { success: true };
});

exports.processPayment = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { designId, licenseType, cardName, cardNumber, expireMonth, expireYear, cvc } = data || {};
  if (!designId || !licenseType) {
    throw new functions.https.HttpsError('invalid-argument', 'Eksik ödeme verisi.');
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email || 'unknown@example.com';
  const designDoc = await db.collection('designs').doc(String(designId)).get();
  if (!designDoc.exists) throw new functions.https.HttpsError('not-found', 'Tasarım bulunamadı.');
  const design = designDoc.data();

  const price = licenseType === 'exclusive' ? Number(design.priceExclusive || 0) : Number(design.priceStandard || design.price || 0);
  if (!price) throw new functions.https.HttpsError('failed-precondition', 'Tasarım fiyatı tanımlı değil.');

  const buyerDoc = await db.collection('users').doc(userId).get();
  const buyer = buyerDoc.exists ? buyerDoc.data() : {};

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `formalola_${Date.now()}`,
    price: price.toFixed(2),
    paidPrice: price.toFixed(2),
    currency: Iyzipay.CURRENCY.TRY,
    installment: '1',
    basketId: String(designId),
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    paymentCard: {
      cardHolderName: cardName,
      cardNumber,
      expireMonth,
      expireYear,
      cvc,
      registerCard: '0'
    },
    buyer: {
      id: userId,
      name: (buyer.name || userEmail.split('@')[0] || 'User').split(' ')[0],
      surname: ((buyer.name || 'User').split(' ').slice(1).join(' ') || 'User'),
      gsmNumber: buyer.phone || '+905555555555',
      email: userEmail,
      identityNumber: buyer.identityNumber || '11111111111',
      registrationAddress: buyer.address || 'Nidakule Göztepe, İstanbul',
      ip: context.rawRequest.ip || '127.0.0.1',
      city: buyer.city || 'Istanbul',
      country: buyer.country || 'Turkey'
    },
    shippingAddress: {
      contactName: buyer.name || 'User', city: buyer.city || 'Istanbul', country: buyer.country || 'Turkey', address: buyer.address || 'Digital Product'
    },
    billingAddress: {
      contactName: buyer.name || 'User', city: buyer.city || 'Istanbul', country: buyer.country || 'Turkey', address: buyer.address || 'Digital Product'
    },
    basketItems: [{
      id: String(designId),
      name: `${design.title || 'Design'} - ${licenseType}`,
      category1: 'Digital Art',
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
      price: price.toFixed(2)
    }]
  };

  const result = await new Promise((resolve, reject) => {
    iyzipay.payment.create(request, (err, res) => err ? reject(err) : resolve(res));
  });

  if (result.status !== 'success') {
    throw new functions.https.HttpsError('aborted', result.errorMessage || 'Ödeme reddedildi.');
  }

  const platformFee = Number((price * 0.20).toFixed(2));
  const designerEarnings = Number((price - platformFee).toFixed(2));

  const purchaseRef = db.collection('purchases').doc();
  await purchaseRef.set({
    designId: String(designId),
    designTitle: design.title || 'Design',
    buyerId: userId,
    buyerEmail: userEmail,
    designerId: design.designerId,
    price,
    license: licenseType,
    iyzicoPaymentId: result.paymentId,
    purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'completed'
  });

  const designPatch = licenseType === 'exclusive'
    ? { status: 'sold_exclusive', sales: admin.firestore.FieldValue.increment(1) }
    : { sales: admin.firestore.FieldValue.increment(1) };
  await db.collection('designs').doc(String(designId)).update(designPatch);

  if (design.designerId) {
    await db.collection('users').doc(design.designerId).set({
      balance: admin.firestore.FieldValue.increment(designerEarnings),
      totalEarned: admin.firestore.FieldValue.increment(designerEarnings),
      totalSales: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  return { success: true, paymentId: result.paymentId };
});

exports.getSecureDownloadUrl = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { designId, fileType } = data || {};
  if (!designId || !fileType) throw new functions.https.HttpsError('invalid-argument', 'Eksik indirme verisi.');

  const purchases = await db.collection('purchases')
    .where('buyerId', '==', context.auth.uid)
    .where('designId', '==', String(designId))
    .where('status', '==', 'completed')
    .limit(1)
    .get();

  if (purchases.empty) {
    throw new functions.https.HttpsError('permission-denied', 'Bu tasarımı indirme yetkiniz yok.');
  }

  const designDoc = await db.collection('designs').doc(String(designId)).get();
  if (!designDoc.exists) throw new functions.https.HttpsError('not-found', 'Tasarım bulunamadı.');
  const designData = designDoc.data();
  const filePath = designData?.sourceFiles?.[fileType];
  if (!filePath) throw new functions.https.HttpsError('not-found', 'İstenen dosya bulunamadı.');

  const file = bucket.file(filePath);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000
  });
  return { downloadUrl: url };
});

exports.moderateDesign = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  const { designId, action, rejectReason } = data || {};
  if (!designId || !action) throw new functions.https.HttpsError('invalid-argument', 'Eksik moderasyon verisi.');

  if (action === 'approve') {
    await db.collection('designs').doc(String(designId)).update({
      status: 'approved',
      visibility: 'public',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: context.auth.uid
    });
  } else if (action === 'reject') {
    await db.collection('designs').doc(String(designId)).update({
      status: 'rejected',
      rejectReason: rejectReason || 'Admin tarafından reddedildi',
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: context.auth.uid
    });
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'Geçersiz aksiyon.');
  }
  return { success: true };
});

exports.requestPayout = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { amount, iban, fullName } = data || {};
  if (!amount || amount < 500) {
    throw new functions.https.HttpsError('invalid-argument', 'Minimum para çekme tutarı 500 TL.');
  }
  if (!iban || !fullName) {
    throw new functions.https.HttpsError('invalid-argument', 'IBAN ve ad soyad zorunlu.');
  }

  const userRef = db.collection('users').doc(context.auth.uid);
  return db.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);
    if (!userDoc.exists) throw new functions.https.HttpsError('not-found', 'Kullanıcı bulunamadı.');
    const balance = Number(userDoc.data().balance || 0);
    if (balance < amount) throw new functions.https.HttpsError('failed-precondition', 'Yetersiz bakiye.');
    tx.update(userRef, { balance: admin.firestore.FieldValue.increment(-amount) });
    const payoutRef = db.collection('payout_requests').doc();
    tx.set(payoutRef, {
      userId: context.auth.uid,
      amount,
      iban,
      fullName,
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  });
});

exports.processPayout = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  const { payoutId, action } = data || {};
  const payoutRef = db.collection('payout_requests').doc(String(payoutId));

  return db.runTransaction(async (tx) => {
    const payoutDoc = await tx.get(payoutRef);
    if (!payoutDoc.exists) throw new functions.https.HttpsError('not-found', 'Talep bulunamadı.');
    const payout = payoutDoc.data();
    if (payout.status !== 'pending') throw new functions.https.HttpsError('failed-precondition', 'Talep zaten işlenmiş.');

    if (action === 'approve') {
      tx.update(payoutRef, {
        status: 'completed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: context.auth.uid
      });
    } else if (action === 'reject') {
      tx.update(db.collection('users').doc(payout.userId), {
        balance: admin.firestore.FieldValue.increment(Number(payout.amount || 0))
      });
      tx.update(payoutRef, {
        status: 'rejected',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedBy: context.auth.uid
      });
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Geçersiz aksiyon.');
    }
    return { success: true };
  });
});

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  if (context.auth.token.email !== adminEmail) {
    throw new functions.https.HttpsError('permission-denied', 'Bu işlem için yetkiniz yok.');
  }
  await admin.auth().setCustomUserClaims(context.auth.uid, { admin: true });
  await db.collection('users').doc(context.auth.uid).set({
    role: 'admin',
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  return { success: true, message: 'Admin yetkisi tanımlandı. Çıkış yapıp tekrar giriş yapın.' };
});
