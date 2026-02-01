<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="Navbar.ascx.cs" Inherits="SmartCampusPortal.Navbar" %>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />

<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container-fluid">
        <a class="navbar-brand" href="#">Smart Campus Portal</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">

                <%-- Guest Links --%>
                <asp:PlaceHolder ID="phGuest" runat="server">
                    <li class="nav-item"><a class="nav-link" href="Login.aspx">Login</a></li>
                    <li class="nav-item"><a class="nav-link" href="Register.aspx">Register</a></li>
                </asp:PlaceHolder>

                <%-- Logged-in Links --%>
                <asp:PlaceHolder ID="phLoggedIn" runat="server">
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="document.getElementById('<%= lnkLogout.ClientID %>').click(); return false;">Logout</a>
                        <asp:LinkButton ID="lnkLogout" runat="server" OnClick="lnkLogout_Click" Style="display:none;" />
                    </li>
                </asp:PlaceHolder>

                <%-- Always Visible --%>
                <li class="nav-item"><a class="nav-link" href="About.aspx">About</a></li>
            </ul>
        </div>
    </div>
</nav>
