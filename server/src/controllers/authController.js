const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const formatUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  companyName: user.companyName || "",
  organization: user.organization || "",
  organizationName: user.organizationName || "",
  builderType: user.builderType || "",
  investmentRange: user.investmentRange || "",
  focus: user.focus || [],
});

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code) {
  return await sendEmail({
    to: email,
    subject: "Verify your MinT Digital Hub account",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%); padding: 24px 32px;">
            <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">Ministry of Innovation and Technology</h1>
            <p style="margin: 8px 0 0; color: #99f6e4; font-size: 13px;">Digital Innovation Hub</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 700;">Verify your email address</h2>
            <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6;">
              To complete your account registration, please use the verification code below. This code is valid for 15 minutes.
            </p>
            <div style="background-color: #f0fdfa; border: 1px dashed #2dd4bf; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; color: #0f766e; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Your verification code</p>
              <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #134e4a;">${code}</p>
            </div>
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
              If you did not request this, you can safely ignore this email.
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              Regards,<br />MinT Digital Innovation Hub
            </p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center;">
              Digital Ethiopia · Ministry of Innovation and Technology
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, code) {
  return await sendEmail({
    to: email,
    subject: "Reset your MinT Digital Hub password",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%); padding: 24px 32px;">
            <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">Ministry of Innovation and Technology</h1>
            <p style="margin: 8px 0 0; color: #99f6e4; font-size: 13px;">Digital Innovation Hub</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 700;">Reset your password</h2>
            <p style="margin: 0 0 24px; color: #475569; font-size: 14px; line-height: 1.6;">
              We received a request to reset your password. Use the code below to set a new password. This code is valid for 15 minutes.
            </p>
            <div style="background-color: #f0fdfa; border: 1px dashed #2dd4bf; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; color: #0f766e; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Password reset code</p>
              <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #134e4a;">${code}</p>
            </div>
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
              If you did not request a password reset, please ignore this email.
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              Regards,<br />MinT Digital Innovation Hub
            </p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center;">
              Digital Ethiopia · Ministry of Innovation and Technology
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

// ====================== REGISTER ======================
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide fullName, email and password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const allowedRoles = [
      "founder",
      "investor",
      "citizen",
      "ecosystem_builder",
    ];
    const userRole = allowedRoles.includes(role) ? role : "founder";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const user = await User.create({
      fullName,
      email,
      password,
      role: userRole,
      emailVerified: false,
      emailVerificationCode: code,
      emailVerificationExpires: expires,
    });

    await sendVerificationEmail(email, code);

    res.status(201).json({
      success: true,
      message: "Verification code sent to your email",
      userId: user._id,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email }).select(
      "+emailVerificationCode +emailVerificationExpires",
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.emailVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already verified" });
    }

    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== code ||
      new Date() > new Date(user.emailVerificationExpires)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code" });
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerificationCode +emailVerificationExpires +lastVerificationSentAt",
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.emailVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already verified" });
    }

    // Rate limit: 60 seconds between resend attempts
    const now = new Date();
    const lastSent = user.lastVerificationSentAt
      ? new Date(user.lastVerificationSentAt)
      : null;
    if (lastSent && now - lastSent < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting another code`,
      });
    }

    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.emailVerificationCode = code;
    user.emailVerificationExpires = expires;
    user.lastVerificationSentAt = new Date();
    await user.save();

    await sendVerificationEmail(email, code);

    res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset code has been sent",
      });
    }

    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.passwordResetCode = code;
    user.passwordResetExpires = expires;
    await user.save();

    await sendPasswordResetEmail(email, code);

    res.status(200).json({
      success: true,
      message: "Password reset code sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, code and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findOne({ email }).select(
      "+passwordResetCode +passwordResetExpires",
    );

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    if (
      !user.passwordResetCode ||
      user.passwordResetCode !== code ||
      new Date() > new Date(user.passwordResetExpires)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code" });
    }

    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        email: user.email,
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ====================== UPDATE PROFILE ======================
exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      companyName,
      organization,
      organizationName,
      builderType,
      investmentRange,
      focus,
      currentPassword,
      newPassword,
    } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (fullName !== undefined && fullName.trim()) {
      user.fullName = fullName.trim();
    }

    if (user.role === "founder" && companyName !== undefined) {
      user.companyName = companyName.trim();
    }

    if (user.role === "investor") {
      if (organization !== undefined) user.organization = organization.trim();
      if (investmentRange !== undefined)
        user.investmentRange = investmentRange.trim();
      if (focus !== undefined) {
        user.focus = Array.isArray(focus) ? focus : [];
      }
    }

    if (user.role === "ecosystem_builder") {
      if (organizationName !== undefined) {
        user.organizationName = organizationName.trim();
      }
      if (builderType !== undefined) user.builderType = builderType;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password",
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }

      user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== GET ME ======================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
