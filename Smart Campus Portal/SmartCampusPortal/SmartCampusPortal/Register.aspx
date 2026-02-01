<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Register.aspx.cs" Inherits="SmartCampusPortal.Register" %>

<%@ Register Src="~/Navbar.ascx" TagPrefix="uc" TagName="Navbar" %>

<!DOCTYPE html>
<html lang="en">
<head runat="server">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Smart Campus Portal - Register</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />

    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />

    <style>
        :root {
            --primary-color: #0d6efd;
            --password-box-bg: #f8f9fa;
            --password-box-border: #ced4da;
            --password-box-text: #333;
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

        .register-container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 0.15rem 1.75rem rgba(0,0,0,0.15);
            overflow: visible;
        }

        .register-header {
            background: var(--primary-color);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .register-form-container {
            padding: 2rem;
            position: relative;
        }

        .form-control:focus {
            box-shadow: none;
            border-color: var(--primary-color);
        }

        .btn-register {
            width: 100%;
            padding: 0.75rem;
            font-size: 1.1rem;
            background-color: var(--primary-color);
            border: none;
            transition: all 0.3s;
        }

            .btn-register:hover {
                background-color: #0b5ed7;
                box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
            }

        .password-wrapper {
            position: relative;
        }

        .toggle-password {
            position: absolute;
            top: 50%;
            right: 1rem;
            transform: translateY(-50%);
            font-size: 1.2rem;
            cursor: pointer;
            color: #6c757d;
        }

        .password-info-box {
            position: absolute;
            top: 0;
            left: -240px;
            width: 220px;
            background-color: var(--password-box-bg);
            border: 1px solid var(--password-box-border);
            border-radius: 8px;
            padding: .75rem;
            font-size: .875rem;
            color: var(--password-box-text);
            display: none;
            z-index: 1000;
        }

        .password-strength {
            margin-top: .5rem;
            font-weight: bold;
            font-size: .875rem;
        }
    </style>
</head>
<body>
    <form id="form1" runat="server">
        <uc:Navbar runat="server" ID="Navbar1" />

        <div class="main-content">
            <div class="container">
                <div class="register-container">
                    <div class="register-header">
                        <h1><i class="fas fa-university me-2"></i>Smart Campus Portal</h1>
                        <p class="mb-0">Fill in your details to register as a student</p>
                    </div>

                    <div class="register-form-container">
                        <!-- Hidden role for student only -->
                        <asp:HiddenField ID="hfRole" runat="server" Value="Student" />

                        <!-- Username -->
                        <div class="mb-3">
                            <label class="form-label">Username</label>
                            <asp:TextBox ID="txtUsername" runat="server"
                                CssClass="form-control form-control-lg"
                                Placeholder="Enter your username" />
                        </div>

                        <!-- Email -->
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <asp:TextBox ID="txtEmail" runat="server"
                                CssClass="form-control form-control-lg"
                                Placeholder="Enter your email" />
                        </div>

                        <!-- Full Name -->
                        <div class="mb-3">
                            <label class="form-label">Full Name</label>
                            <asp:TextBox ID="txtFullName" runat="server"
                                CssClass="form-control form-control-lg"
                                Placeholder="Enter your full name" />
                        </div>

                        <!-- Password -->
                        <div class="mb-4">
                            <label class="form-label">Password</label>
                            <div class="password-wrapper">
                                <asp:TextBox ID="txtPassword" runat="server"
                                    TextMode="Password"
                                    CssClass="form-control form-control-lg"
                                    Placeholder="Enter your password"
                                    onfocus="showPasswordInfo();"
                                    onblur="hidePasswordInfo();"
                                    onkeyup="checkPasswordStrength();" />
                                <i class="fas fa-eye toggle-password" onclick="togglePassword();"></i>
                                <div class="password-info-box" id="passwordInfo">
                                    <ul class="mb-1 ps-3">
                                        <li>At least 8 characters</li>
                                        <li>At least 1 uppercase letter</li>
                                        <li>At least 1 number</li>
                                        <li>At least 1 special character</li>
                                    </ul>
                                    <div id="passwordStrength" class="password-strength"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Confirm Password -->
                        <div class="mb-4">
                            <label class="form-label">Confirm Password</label>
                            <asp:TextBox ID="txtConfirmPassword" runat="server"
                                TextMode="Password"
                                CssClass="form-control form-control-lg"
                                Placeholder="Confirm your password" />
                        </div>

                        <!-- Register Button -->
                        <div class="d-grid gap-2">
                            <asp:Button ID="btnRegister" runat="server" Text="Register"
                                OnClick="btnRegister_Click" CssClass="btn btn-primary"
                                CausesValidation="true" />

                        </div>

                        <!-- Status Message -->
                        <div class="mt-4 text-center">
                            <asp:Label ID="lblMsg" runat="server"
                                CssClass="d-block mt-2"
                                EnableViewState="false" />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </form>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        function togglePassword() {
            var pwd = document.getElementById('<%= txtPassword.ClientID %>');
            var icon = document.querySelector('.toggle-password');
            if (pwd.type === 'password') {
                pwd.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                pwd.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        }
        function showPasswordInfo() {
            document.getElementById('passwordInfo').style.display = 'block';
        }
        function hidePasswordInfo() {
            document.getElementById('passwordInfo').style.display = 'none';
        }
        function checkPasswordStrength() {
            var pwd = document.getElementById('<%= txtPassword.ClientID %>').value;
            var strength = 'Weak', color = 'red';
            if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[\W]/.test(pwd)) {
                strength = 'Strong'; color = 'green';
            } else if (pwd.length >= 6) {
                strength = 'Moderate'; color = 'orange';
            }
            document.getElementById('passwordStrength').innerHTML =
                'Strength: <span style="color:' + color + '">' + strength + '</span>';
        }
    </script>
</body>
</html>
