using System;
using System.Configuration;
using System.Linq;
using SmartCampusPortal;

namespace SmartCampusPortal
{
    public partial class Login : System.Web.UI.Page
    {
        protected void btnLogin_Click(object sender, EventArgs e)
        {
            try
            {
                string role = hfRole.Value?.Trim();
                string username = txtUsername.Text.Trim();
                string password = txtPassword.Text;

                if (string.IsNullOrEmpty(role))
                {
                    ShowError("Select a role.");
                    return;
                }
                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                {
                    ShowError("Username/Password required.");
                    return;
                }

                string cs = ConfigurationManager
                    .ConnectionStrings["SmartCampusDBConnectionString"]
                    .ConnectionString;

                using (var db = new DataClassesDataContext(cs))
                {
                    var user = db.Users
                                 .FirstOrDefault(u => u.Username == username && u.IsActive);

                    if (user == null || !PasswordHasher.VerifyHashedPassword(user.PasswordHash, password))
                    {
                        ShowError("Invalid username or password.");
                        return;
                    }
                    if (!string.Equals(user.Role, role, StringComparison.OrdinalIgnoreCase))
                    {
                        ShowError($"Not registered as {role}.");
                        return;
                    }

                    
                    Session["UserID"] = user.UserID;
                    Session["Username"] = user.Username;
                    Session["Role"] = user.Role;
                    Session.Timeout = 30;

                   
                    switch (user.Role)
                    {
                        case "Admin":
                            Response.Redirect("~/AdminDashboard.aspx");
                            break;
                        case "Faculty":
                            Response.Redirect("~/FacultyDashboard.aspx");
                            break;
                        default:
                            Response.Redirect("~/StudentDashboard.aspx");
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                ShowError("Unexpected error: " + ex.Message);
            }
        }


        private void ShowError(string msg)
        {
            lblMsg.Visible = true;
            lblMsg.CssClass = "alert alert-danger";
            lblMsg.Text = msg;
        }
    }
}
