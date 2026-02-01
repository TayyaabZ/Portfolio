<%@ Page Language="C#" AutoEventWireup="true"
    CodeBehind="StudentDashboard.aspx.cs"
    Inherits="SmartCampusPortal.StudentDashboard" %>
<%@ Register Src="~/Navbar.ascx" TagPrefix="uc" TagName="Navbar" %>

<!DOCTYPE html>
<html lang="en">
<head runat="server">
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Student Dashboard – Smart Campus Portal</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <style>
    body { background-color: #f8f9fa; }
    .dashboard-header { background:#0d6efd; color:#fff; padding:1.5rem; border-radius:.5rem; margin-bottom:2rem; text-align:center; }
    .card { border:none; border-radius:.5rem; box-shadow:0 .25rem .5rem rgba(0,0,0,.05); }
    .section-title { font-size:1.2rem; font-weight:600; border-bottom:1px solid #dee2e6; margin-bottom:1rem; padding-bottom:.5rem; }
  </style>
</head>
<body>
  <form id="form1" runat="server">
    <uc:Navbar runat="server" ID="Navbar1" />

    <!-- Hidden field to preserve active tab -->
    <asp:HiddenField ID="hfActiveTab" runat="server" />

    <div class="container mt-4">
      <div class="dashboard-header">
        <h2>Welcome, <asp:Literal ID="litFullName" runat="server" /></h2>
      </div>

      <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item">
          <a id="linkHome" class="nav-link active" data-bs-toggle="tab"
             href="#tabHome" role="tab"
             onclick="document.getElementById('<%=hfActiveTab.ClientID%>').value='tabHome';">
            Home
          </a>
        </li>
        <li class="nav-item">
          <a id="linkContent" class="nav-link" data-bs-toggle="tab"
             href="#tabContent" role="tab"
             onclick="document.getElementById('<%=hfActiveTab.ClientID%>').value='tabContent';">
            Course Content
          </a>
        </li>
        <li class="nav-item">
          <a id="linkAssign" class="nav-link" data-bs-toggle="tab"
             href="#tabAssign" role="tab"
             onclick="document.getElementById('<%=hfActiveTab.ClientID%>').value='tabAssign';">
            Assignments
          </a>
        </li>
      </ul>

      <div class="tab-content pt-4">
        <!-- Tab 1: Home -->
        <div class="tab-pane fade show active" id="tabHome" role="tabpanel">
          <div class="row g-4">
            <!-- Left Column -->
            <div class="col-lg-4">
              <!-- Profile Card -->
              <div class="card p-4 mb-4">
                <div class="section-title">My Profile</div>
                <p><strong>Username:</strong> <asp:Literal ID="litUsername" runat="server" /></p>
                <p><strong>Email:</strong>    <asp:Literal ID="litEmail"    runat="server" /></p>
                <p><strong>Major:</strong>    <asp:Literal ID="litMajor"    runat="server" /></p>
                <p><strong>Enrolled:</strong> <asp:Literal ID="litEnrollDate" runat="server" /></p>
                <p><strong>GPA:</strong>      <asp:Literal ID="litGPA"      runat="server" /></p>
              </div>
              <!-- Change Password Card -->
              <div class="card p-4">
                <div class="section-title">Change Password</div>
                <asp:TextBox ID="txtOldPassword" runat="server"
                             CssClass="form-control mb-2"
                             TextMode="Password"
                             placeholder="Old Password" />
                <asp:TextBox ID="txtNewPassword" runat="server"
                             CssClass="form-control mb-2"
                             TextMode="Password"
                             placeholder="New Password" />
                <asp:TextBox ID="txtConfirmPassword" runat="server"
                             CssClass="form-control mb-2"
                             TextMode="Password"
                             placeholder="Confirm New Password" />
                <asp:Button ID="btnChangePassword" runat="server"
                            Text="Change Password"
                            CssClass="btn btn-warning w-100"
                            OnClick="btnChangePassword_Click" />
                <asp:Label ID="lblPasswordMessage" runat="server"
                           CssClass="mt-2 d-block" />
              </div>
            </div>
            <!-- Right Column -->
            <div class="col-lg-8">
              <!-- My Courses -->
              <div class="card p-4 mb-4">
                <div class="section-title">My Courses</div>
                <asp:GridView ID="gvCourses" runat="server"
                              AutoGenerateColumns="false"
                              CssClass="table table-striped">
                  <Columns>
                    <asp:BoundField DataField="CourseCode" HeaderText="Code" />
                    <asp:BoundField DataField="Title"      HeaderText="Title" />
                    <asp:BoundField DataField="Semester"   HeaderText="Semester" />
                    <asp:BoundField DataField="Year"       HeaderText="Year" />
                    <asp:BoundField DataField="Grade"      HeaderText="Grade" />
                  </Columns>
                </asp:GridView>
              </div>
              <!-- Register for Courses -->
              <div class="card p-4 mb-4">
                <div class="section-title">Register for Courses</div>
                <asp:DropDownList ID="ddlAvailableSections" runat="server"
                                  CssClass="form-select mb-2" />
                <asp:Button ID="btnEnroll" runat="server"
                            Text="Enroll"
                            CssClass="btn btn-primary"
                            OnClick="btnEnroll_Click" />
                <asp:Label ID="lblEnrollMsg" runat="server"
                           CssClass="mt-2 d-block" />
              </div>
              <!-- Latest Announcements -->
              <div class="card p-4">
                <div class="section-title">Latest Announcements</div>
                <asp:Repeater ID="rptAnnouncements" runat="server">
                  <ItemTemplate>
                    <div class="mb-3">
                      <h6 class="mb-1"><%# Eval("Title") %></h6>
                      <small class="text-muted"><%# Eval("PostDate","{0:yyyy-MM-dd}") %></small>
                      <p class="mb-0"><%# Eval("Content") %></p>
                      <hr />
                    </div>
                  </ItemTemplate>
                </asp:Repeater>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Course Content -->
        <div class="tab-pane fade" id="tabContent" role="tabpanel">
          <asp:DropDownList ID="ddlSectionsContent" runat="server"
              CssClass="form-select mb-3"
              AutoPostBack="true"
              OnSelectedIndexChanged="ddlSectionsContent_SelectedIndexChanged" />
          <asp:Repeater ID="rptCourseContent" runat="server">
            <ItemTemplate>
              <div class="card mb-2">
                <div class="card-body">
                  <h5 class="card-title">
                    <%# System.IO.Path.GetFileName(Eval("FilePath").ToString()) %>
                  </h5>
                  <p class="card-text">
                    <small class="text-muted">
                      <%# Eval("UploadDate","{0:yyyy-MM-dd}") %>
                    </small>
                  </p>
                  <a href='<%# ResolveUrl(Eval("FilePath").ToString()) %>'
                     target="_blank">Download</a>
                </div>
              </div>
            </ItemTemplate>
          </asp:Repeater>
        </div>

        <!-- Tab 3: Assignments -->
        <div class="tab-pane fade" id="tabAssign" role="tabpanel">
          <asp:DropDownList ID="ddlSectionsAssignments" runat="server"
              CssClass="form-select mb-3"
              AutoPostBack="true"
              OnSelectedIndexChanged="ddlSectionsAssignments_SelectedIndexChanged" />

          <asp:DropDownList ID="ddlAssignments" runat="server"
              CssClass="form-select mb-3"
              AutoPostBack="true"
              OnSelectedIndexChanged="ddlAssignments_SelectedIndexChanged">
            <asp:ListItem Value="0" Text="-- Select Assignment --" />
          </asp:DropDownList>

          <asp:Panel ID="pnlAssignmentDetails" runat="server" Visible="false">
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">
                  <asp:Literal ID="litAsgTitle" runat="server" />
                </h5>
                <p class="card-text">
                  <asp:Literal ID="litAsgDesc" runat="server" />
                </p>
                <p>
                  <strong>Due:</strong>
                  <asp:Literal ID="litAsgDue" runat="server" />
                  &nbsp;|&nbsp;
                  <strong>Grade:</strong>
                  <asp:Literal ID="litAsgGrade" runat="server" />
                </p>
                <asp:HyperLink ID="hlAsgDownload" runat="server"
                    Text="Download Assignment"
                    CssClass="btn btn-link"
                    Visible="false" />
              </div>
            </div>
          </asp:Panel>

          <div class="mt-4">
            <asp:FileUpload ID="fuAssignmentUpload" runat="server"
                CssClass="form-control mb-2" />
            <asp:Button ID="btnUploadAssignment" runat="server"
                Text="Upload Submission"
                CssClass="btn btn-primary"
                OnClick="btnUploadAssignment_Click" />
            <asp:Label ID="lblUploadStatus" runat="server"
                CssClass="mt-2 d-block" />
          </div>
        </div>
      </div>
    </div>
  </form>

  <script>
    document.addEventListener('DOMContentLoaded', function () {
      var active = document.getElementById('<%=hfActiveTab.ClientID%>').value || 'tabHome';
        var trigger = document.querySelector('a[href="#' + active + '"]');
        if (trigger) new bootstrap.Tab(trigger).show();
    });
  </script>
</body>
</html>
