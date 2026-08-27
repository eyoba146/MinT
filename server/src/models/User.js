const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: [
        'founder',
        'investor',
        'admin',
        'citizen',
        'ecosystem_builder',
        'reviewer',
        'moderator',
      ],
      default: 'founder',
    },
    companyName: String,
    organization: {
      type: String,
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    builderType: {
      type: String,
      enum: [
        'incubator',
        'accelerator',
        'coworking',
        'angel_network',
        'university',
        'research',
        'ngo',
        'other',
        '',
      ],
      default: '',
    },
    investmentRange: {
      type: String,
      trim: true,
    },
    focus: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);