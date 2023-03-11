import nodemailer from 'nodemailer'
export default function sendOTP(email, otp){
    return new Promise((resolve, reject)=>{
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL,
              pass: process.env.PASSWORD,
            },
          });
      
            var mailOptions={
              from: process.env.EMAIL,
              to: email,
              subject: "Adan Perfumes Email verification",
              html: `
              <h1>Verify Your Email For Adan Perfumes</h1>
                <h3>use this code in Adan Perfumes to verify your email</h3>
                <h2>${otp}</h2>
              `,
            }
        
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                reject(error)

              } else {
                resolve({success:true, message:"Email sent successfull"})
              }
            });
    })
}
