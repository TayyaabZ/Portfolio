<%@ Page Language="C#" AutoEventWireup="true"
    CodeBehind="AdminDashboard.aspx.cs"
    Inherits="SmartCampusPortal.AdminDashboard" %>

<%@ Register Src="~/Navbar.ascx" TagPrefix="uc" TagName="Navbar" %>



<!DOCTYPE html>
<html lang="en">
<head runat="server">
    <meta charset="utf-8" />
    <title>Admin Dashboard – Smart Campus Portal</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- Bootstrap CSS + JS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js">
    </script>
    <style>
        .dashboard-header {
            background-color: #0d6efd;
            color: #fff;
            padding: 1rem;
            border-radius: .25rem;
            margin-bottom: 1.5rem;
        }

        .nav-tabs .nav-link.active {
            background-color: #0d6efd;
            color: #fff;
        }

        .card {
            border-radius: .5rem;
            box-shadow: 0 .125rem .25rem rgba(0,0,0,.075);
        }
    </style>
</head>
<body>
    <form id="form1" runat="server">
        <uc:Navbar runat="server" ID="Navbar1" />

        <div class="container mt-4">
            <div class="dashboard-header text-center">
                <h2>Admin Dashboard</h2>
                <p>Manage Courses, Sections, Announcements, and Users</p>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs mb-4" id="dashboardTabs">
                <li class="nav-item">
                    <a class="nav-link active" data-bs-toggle="tab" href="#summaryTab">Summary
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#coursesTab">Courses
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#announcementTab">Announcements
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#manageUsersTab">Manage Users
                    </a>
                </li>
            </ul>

            <div class="tab-content">
                <!-- Summary Tab -->
                <div class="tab-pane fade show active" id="summaryTab">
                    <div class="row g-4">
                        <div class="col-md-4">
                            <div class="card p-3">
                                <h5>User Summary</h5>
                                <hr />
                                <p>
                                    <strong>Total Users:</strong>
                                    <asp:Literal ID="litTotalUsers" runat="server" />
                                </p>
                                <p>
                                    <strong>Students:</strong>
                                    <asp:Literal ID="litTotalStudents" runat="server" />
                                </p>
                                <p>
                                    <strong>Faculty:</strong>
                                    <asp:Literal ID="litTotalFaculty" runat="server" />
                                </p>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="card p-3">
                                <h5>All Users</h5>
                                <hr />
                                <asp:GridView ID="gvUsers" runat="server"
                                    CssClass="table table-bordered"
                                    AutoGenerateColumns="false">
                                    <Columns>
                                        <asp:BoundField DataField="Username" HeaderText="Username" />
                                        <asp:BoundField DataField="FullName" HeaderText="Full Name" />
                                        <asp:BoundField DataField="Email" HeaderText="Email" />
                                        <asp:BoundField DataField="Role" HeaderText="Role" />
                                    </Columns>
                                </asp:GridView>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Courses Tab -->
                <div class="tab-pane fade" id="coursesTab">
                    <div class="row g-4">
                        <!-- Create Course -->
                        <div class="col-md-6">
                            <div class="card p-3">
                                <h5>Create Course</h5>
                                <hr />
                                <asp:TextBox ID="txtCourseCode" runat="server"
                                    CssClass="form-control mb-2" placeholder="Course Code" />
                                <asp:TextBox ID="txtCourseTitle" runat="server"
                                    CssClass="form-control mb-2" placeholder="Title" />
                                <asp:TextBox ID="txtCourseDesc" runat="server"
                                    TextMode="MultiLine" Rows="2"
                                    CssClass="form-control mb-2" placeholder="Description" />
                                <asp:TextBox ID="txtCredits" runat="server"
                                    CssClass="form-control mb-2" placeholder="Credits" />
                                <asp:DropDownList ID="ddlPrereq" runat="server"
                                    CssClass="form-select mb-2" />
                                <asp:Button ID="btnCreateCourse" runat="server"
                                    CssClass="btn btn-primary" Text="Create Course"
                                    OnClick="btnCreateCourse_Click" />
                                <asp:Label ID="lblCourseMsg" runat="server"
                                    CssClass="text-success mt-2 d-block" />
                            </div>
                        </div>
                        <!-- Create Section -->
                        <div class="col-md-6">
                            <div class="card p-3">
                                <h5>Create Section</h5>
                                <hr />
                                <asp:DropDownList ID="ddlCourses" runat="server"
                                    CssClass="form-select mb-2" />
                                <asp:TextBox ID="txtSemester" runat="server"
                                    CssClass="form-control mb-2" placeholder="Semester" />
                                <asp:TextBox ID="txtYear" runat="server"
                                    CssClass="form-control mb-2" placeholder="Year" />
                                <asp:TextBox ID="txtSchedule" runat="server"
                                    CssClass="form-control mb-2"
                                    placeholder="Schedule (e.g. M/W/F 10-11am)" />
                                <asp:DropDownList ID="ddlSectionFaculty" runat="server" CssClass="form-select mb-2" />
                                <asp:TextBox ID="txtLocation" runat="server"
                                    CssClass="form-control mb-2" placeholder="Location" />
                                <asp:Button ID="btnCreateSection" runat="server"
                                    CssClass="btn btn-secondary" Text="Create Section"
                                    OnClick="btnCreateSection_Click" />
                                <asp:Label ID="lblSectionMsg" runat="server"
                                    CssClass="text-success mt-2 d-block" />
                            </div>
                        </div>
                    </div>
                </div>

            

                <!-- Manage Users Tab -->
                <div class="tab-pane fade" id="manageUsersTab">
                    <div class="row g-4">
                        <!-- Register Admin -->
                        <div class="col-md-6">
                            <div class="card p-3">
                                <h5>Register Admin</h5>
                                <hr />
                                <asp:TextBox ID="txtAdminUsername" runat="server"
                                    CssClass="form-control mb-2" placeholder="Username" />
                                <asp:TextBox ID="txtAdminFullName" runat="server"
                                    CssClass="form-control mb-2" placeholder="Full Name" />
                                <asp:TextBox ID="txtAdminEmail" runat="server"
                                    CssClass="form-control mb-2" placeholder="Email" />
                                <asp:TextBox ID="txtAdminPassword" runat="server"
                                    TextMode="Password"
                                    CssClass="form-control mb-2" placeholder="Password" />
                                <asp:Button ID="btnRegisterAdmin" runat="server"
                                    CssClass="btn btn-success" Text="Register Admin"
                                    OnClick="btnRegisterAdmin_Click" />
                                <asp:Label ID="lblAdminMessage" runat="server"
                                    CssClass="text-success mt-2 d-block" />
                            </div>
                        </div>
                        <!-- Register Faculty -->
                        <div class="col-md-6">
                            <div class="card p-3">
                                <h5>Register Faculty</h5>
                                <hr />
                                <asp:TextBox ID="txtFacultyUsername" runat="server"
                                    CssClass="form-control mb-2" placeholder="Username" />
                                <asp:TextBox ID="txtFacultyFullName" runat="server"
                                    CssClass="form-control mb-2" placeholder="Full Name" />
                                <asp:TextBox ID="txtFacultyEmail" runat="server"
                                    CssClass="form-control mb-2" placeholder="Email" />
                                <asp:TextBox ID="txtFacultyPassword" runat="server"
                                    TextMode="Password"
                                    CssClass="form-control mb-2" placeholder="Password" />
                                <asp:TextBox ID="txtFacultyDepartment" runat="server"
                                    CssClass="form-control mb-2" placeholder="Department" />
                                <asp:TextBox ID="txtFacultyPosition" runat="server"
                                    CssClass="form-control mb-2" placeholder="Position" />
                                <asp:Button ID="btnRegisterFaculty" runat="server"
                                    CssClass="btn btn-info" Text="Register Faculty"
                                    OnClick="btnRegisterFaculty_Click" />
                                <asp:Label ID="lblFacultyMessage" runat="server"
                                    CssClass="text-success mt-2 d-block" />
                            </div>
                        </div>
                        <!-- Update Major -->
                        <div class="col-md-12">
                            <div class="card p-3">
                                <h5>Update Student Major</h5>
                                <hr />
                                <asp:DropDownList ID="ddlStudents" runat="server"
                                    CssClass="form-select mb-2" />
                                <asp:TextBox ID="txtNewMajor" runat="server"
                                    CssClass="form-control mb-2" placeholder="New Major" />
                                <asp:Button ID="btnUpdateMajor" runat="server"
                                    CssClass="btn btn-warning" Text="Update Major"
                                    OnClick="btnUpdateMajor_Click" />
                                <asp:Label ID="lblMajorMessage" runat="server"
                                    CssClass="text-success mt-2 d-block" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Hidden field to remember active tab -->
        <asp:HiddenField ID="hfActiveTab" runat="server" />

        <script>

            document.querySelectorAll('#dashboardTabs a[data-bs-toggle="tab"]')
                .forEach(tab => tab.addEventListener('shown.bs.tab', e => {
                    var tgt = e.target.getAttribute('href'); // e.g. "#coursesTab"
                    document.getElementById('<%= hfActiveTab.ClientID %>').value = tgt;
            }));


            window.addEventListener('load', function () {
                var active = document.getElementById('<%= hfActiveTab.ClientID %>').value;
            if (active) {
                var tabEl = document.querySelector('#dashboardTabs a[href="' + active + '"]');
                if (tabEl) new bootstrap.Tab(tabEl).show();
            }
        });
        </script>
    </form>


</body>
</html>
