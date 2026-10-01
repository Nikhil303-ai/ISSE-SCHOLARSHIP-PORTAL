const nodemailer = require("nodemailer");

const sendStatusUpdateEmail = async (studentEmail, studentName, scholarshipTitle, status, notes) => {
  try {
    // 1. Configure Transporter to use Gmail service with EMAIL_USER & EMAIL_PASS
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const statusFormatted = status.replaceAll("_", " ").toUpperCase();

    const mailOptions = {
      from: `"ISSE Portal Notifications" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Application Status Update: ${scholarshipTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-top: 0;">ISSE Application Update</h2>
          <p>Hello <strong>${studentName}</strong>,</p>
          <p>Your application status for <strong>${scholarshipTitle}</strong> has been updated by the administration cell.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; font-size: 14px;"><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${statusFormatted}</span></p>
            ${notes ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #475569;"><strong>Admin Remarks:</strong> ${notes}</p>` : ""}
          </div>

          <p style="font-size: 12px; color: #64748b;">Log in to your student dashboard to review details or upload required verification documents.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 20px;" />
          <p style="font-size: 10px; color: #94a3b8; text-align: center;">Integrated Student Success Ecosystem (ISSE)</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Status update email sent successfully: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Nodemailer Email Error:", error.message);
    return false;
  }
};

module.exports = sendStatusUpdateEmail;