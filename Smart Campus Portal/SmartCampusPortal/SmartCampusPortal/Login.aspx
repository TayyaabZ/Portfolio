<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Login.aspx.cs" Inherits="SmartCampusPortal.Login" %>
<%@ Register Src="~/Navbar.ascx" TagPrefix="uc" TagName="Navbar" %>

<!DOCTYPE html>
<html lang="en">
<head runat="server">
  <title>Smart Campus Portal - Login</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    :root {
      --primary-color: #0d6efd;
      --student-color: #4e73df;
      --faculty-color: #1cc88a;
      --admin-color: #e74a3b;
    }

    body {
      background-color: #f8f9fc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 2rem 0;
    }

    .login-container {
      max-width: 800px;
      width: 100%;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      box-shadow: 0 0.15rem 1.75rem 0 rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .login-header {
      background: var(--primary-color);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .role-selection {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin: 2rem 0;
      flex-wrap: wrap;
    }

    .role-card {
      width: 150px;
      height: 150px;
      border-radius: 15px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      border: 3px solid transparent;
      text-align: center;
      padding: 15px;
      background-color: #e9ecef;
      color: var(--primary-color);
    }

    .role-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    .role-card.selected {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.4);
      background-color: rgba(13, 110, 253, 0.1);
    }

    .role-card i {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }

    .student-card { color: var(--student-color); }
    .faculty-card { color: var(--faculty-color); }
    .admin-card   { color: var(--admin-color); }

    .login-form-container {
      padding: 2rem;
      display: none;
    }

    .form-control:focus {
      box-shadow: none;
      border-color: var(--primary-color);
    }

    .btn-login {
      width: 100%;
      padding: 0.75rem;
      font-size: 1.1rem;
      transition: all 0.3s;
      background-color: var(--primary-color);
      border: none;
    }

    .btn-login:hover {
      background-color: #0b5ed7;
    }

    .navbar {
      box-shadow: 0 0.15rem 1.75rem 0 rgba(0, 0, 0, 0.15);
    }
  </style>
</head>
<body>
  <form id="form1" runat="server">
    <uc:Navbar runat="server" ID="Navbar1" />

    <asp:ScriptManager ID="ScriptManager1" runat="server" />

    <div class="main-content">
      <div class="container">
        <div class="login-container">
          <div class="login-header">
            <h1><i class="fas fa-university me-2"></i>Smart Campus Portal</h1>
            <p class="mb-0">Please select your role to continue</p>
          </div>

          <div class="p-4">
            <div class="role-selection">
              <div class="role-card student-card" id="role-Student" onclick="selectRole('Student')">
                <i class="fas fa-user-graduate"></i>
                <span>Student</span>
              </div>
              <div class="role-card faculty-card" id="role-Faculty" onclick="selectRole('Faculty')">
                <i class="fas fa-chalkboard-teacher"></i>
                <span>Faculty</span>
              </div>
              <div class="role-card admin-card" id="role-Admin" onclick="selectRole('Admin')">
                <i class="fas fa-user-shield"></i>
                <span>Administrator</span>
              </div>
            </div>

            <asp:UpdatePanel ID="UpdatePanel1" runat="server">
              <ContentTemplate>
                <div class="login-form-container" id="loginForm">
                  <h3 class="text-center mb-4" id="selectedRoleLabel">Select a role to login</h3>

                  <asp:Label ID="lblMsg" runat="server" CssClass="alert alert-danger d-block" Visible="false"></asp:Label>

                  <div class="mb-3">
                    <label class="form-label">Username</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="fas fa-user"></i></span>
                      <asp:TextBox ID="txtUsername" runat="server" CssClass="form-control form-control-lg" placeholder="Enter your username"></asp:TextBox>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="form-label">Password</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="fas fa-lock"></i></span>
                      <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" CssClass="form-control form-control-lg" placeholder="Enter your password"></asp:TextBox>
                    </div>
                  </div>

                  <div class="mb-3 form-check">
                    <asp:CheckBox ID="chkRememberMe" runat="server" CssClass="form-check-input" />
                    <label class="form-check-label" for="<%= chkRememberMe.ClientID %>">Remember me</label>
                  </div>

                  <asp:HiddenField ID="hfRole" runat="server" />

                  <asp:Button ID="btnLogin" runat="server" Text="Login"
                      CssClass="btn btn-primary btn-login mb-3"
                      OnClick="btnLogin_Click" />
                </div>
              </ContentTemplate>
              <Triggers>
                <asp:PostBackTrigger ControlID="btnLogin" />
              </Triggers>
            </asp:UpdatePanel>

            <div class="text-center mt-2">
              <a href="#" class="text-decoration-none">Forgot Password?</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <script>
        function selectRole(role) {
            $('.role-card').removeClass('selected');
            $('#role-' + role).addClass('selected');

            let icon = '', text = '';
            if (role === 'Student') { icon = 'fa-user-graduate'; text = 'Student Login'; }
            if (role === 'Faculty') { icon = 'fa-chalkboard-teacher'; text = 'Faculty Login'; }
            if (role === 'Admin') { icon = 'fa-user-shield'; text = 'Administrator Login'; }

            $('#selectedRoleLabel').html(`<i class="fas ${icon} me-2"></i>${text}`);
            $('#<%= hfRole.ClientID %>').val(role);
        $('#loginForm').fadeIn(300);
        $('#<%= txtUsername.ClientID %>').focus();
      }

      $(document).ready(function () {
        if ($('#<%= hfRole.ClientID %>').val()) {
              $('#loginForm').show();
          }

          $('.role-card').each(function (i) {
              $(this).css('opacity', 0).delay(100 * i).animate({ opacity: 1 }, 300);
          });
      });
    </script>
  </form>
</body>
</html>
