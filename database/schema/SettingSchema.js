import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  navLogo: String,
  heroTitle: String,
  heroSub: String,
  footerText: String,
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;