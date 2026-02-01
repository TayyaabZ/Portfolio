using System;

namespace SmartCampusPortal
{
    public partial class Navbar : System.Web.UI.UserControl
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                string username = Session["Username"] as string;

                if (string.IsNullOrEmpty(username))
                {
                    
                    phGuest.Visible = true;
                    phLoggedIn.Visible = false;
                }
                else
                {
                    
                    phGuest.Visible = false;
                    phLoggedIn.Visible = true;
                }
            }
        }

        protected void lnkLogout_Click(object sender, EventArgs e)
        {
            Session.Clear();
            Session.Abandon();
            Response.Redirect("~/Login.aspx");
        }
    }
}
