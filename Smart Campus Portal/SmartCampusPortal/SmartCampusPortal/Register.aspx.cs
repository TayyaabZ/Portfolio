using System;
using System.Configuration;
using System.Linq;
using System.Web.UI;

namespace SmartCampusPortal
{
    public partial class Register : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            // Prevent logged-in users from accessing register page
            if (Session["UserID"] != null && Session["Role"] != null)
            {
                string role = Session["Role"].ToString();
                if (role == "Student")
                {
                    Response.Redirect("~/StudentDashboard.aspx");
                }
                else if (role == "Faculty")
                {
                    Response.Redirect("~/FacultyDashboard.aspx");
                }
                else if (role == "Admin")
                {
                    Response.Redirect("~/AdminDashboard.aspx");
                }
            }

            hfRole.Value = "Student"; // Ensure registration role
        }


        protected void btnRegister_Click(object sender, EventArgs e)
        {
            // Reset any previous message
            lblMsg.CssClass = "alert alert-danger d-none";
            lblMsg.Text = "";

            // 1) Validate
            if (string.IsNullOrWhiteSpace(txtUsername.Text) ||
                string.IsNullOrWhiteSpace(txtEmail.Text) ||
                string.IsNullOrWhiteSpace(txtFullName.Text) ||
                string.IsNullOrWhiteSpace(txtPassword.Text) ||
                string.IsNullOrWhiteSpace(txtConfirmPassword.Text))
            {
                ShowError("Please fill in all fields.");
                return;
            }
            if (txtPassword.Text != txtConfirmPassword.Text)
            {
                ShowError("Passwords do not match.");
                return;
            }
            var pwd = txtPassword.Text;
            if (pwd.Length < 8 || !pwd.Any(char.IsUpper) || !pwd.Any(char.IsDigit) || pwd.All(char.IsLetterOrDigit))
            {
                ShowError("Password must be ≥8 chars, include uppercase, number, symbol.");
                return;
            }

            // 2) Setup DB
            string conn = ConfigurationManager
                .ConnectionStrings["SmartCampusDBConnectionString"]
                .ConnectionString;
            using (var db = new DataClassesDataContext(conn))
            {
                // 3) Uniqueness checks
                if (db.Users.Any(u => u.Username == txtUsername.Text))
                {
                    ShowError("Username already exists.");
                    return;
                }
                if (db.Users.Any(u => u.Email == txtEmail.Text))
                {
                    ShowError("Email already registered.");
                    return;
                }

                // 4) Insert User
                var user = new User
                {
                    Username = txtUsername.Text,
                    Email = txtEmail.Text,
                    FullName = txtFullName.Text,
                    PasswordHash = PasswordHasher.HashPassword(pwd),
                    Role = "Student",
                    IsActive = true
                };
                db.Users.InsertOnSubmit(user);
                db.SubmitChanges(); // gets user.UserID

                // 5) Sanity check
                if (user.UserID <= 0)
                {
                    ShowError("Registration error: invalid UserID.");
                    return;
                }

                // 6) Insert Student
                var student = new Student
                {
                    UserID = user.UserID,
                    EnrollmentDate = DateTime.Today,
                    Major = "Undeclared",
                    GPA = null
                };
                db.Students.InsertOnSubmit(student);
                db.SubmitChanges();

                // 7) Finally—redirect
                Response.Redirect("~/StudentDashboard.aspx");
            }
        }

        private void ShowError(string msg)
        {
            lblMsg.Text = msg;
            lblMsg.CssClass = "alert alert-danger d-block mt-3";
            lblMsg.Visible = true;
        }
    }
}
