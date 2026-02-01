<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="FacultyDashboard.aspx.cs" Inherits="SmartCampusPortal.FacultyDashboard" %>

<%@ Register Src="~/Navbar.ascx" TagPrefix="uc" TagName="Navbar" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta charset="utf-8" />
    <title>Faculty Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
</head>
<body>
    <form id="form1" runat="server">
        <uc:Navbar runat="server" ID="Navbar" />
        <asp:HiddenField ID="hfActiveTab" runat="server" />

        <div class="container mt-5">
            <h2 class="text-center mb-4">Faculty Dashboard</h2>
            <ul class="nav nav-tabs" id="dashboardTabs" role="tablist">
                <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#sections">My Courses</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#upload">Upload Content</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#announcement">Post Announcement</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#attendance">Attendance Report</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#students">Enrolled Students</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#assignments">Assignments</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#grading">Grading</a></li>
                <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#markAttendance">Mark Attendance</a></li>

            </ul>

            <div class="tab-content border p-4 bg-light">
                <!-- 1. My Courses -->
                <div class="tab-pane fade show active" id="sections">
                    <h4>My Course Sections</h4>
                    <asp:GridView ID="gvSections" runat="server" CssClass="table table-bordered" AutoGenerateColumns="false">
                        <Columns>
                            <asp:BoundField DataField="Title" HeaderText="Course Title" />
                            <asp:BoundField DataField="Semester" HeaderText="Semester" />
                            <asp:BoundField DataField="Year" HeaderText="Year" />
                        </Columns>
                    </asp:GridView>
                </div>

                <!-- 2. Upload Content -->
                <div class="tab-pane fade" id="upload">
                    <h4>Upload Course Content</h4>
                    <asp:DropDownList ID="ddlMySections" runat="server" CssClass="form-select mb-2" />
                    <asp:FileUpload ID="fileCourseContent" runat="server" CssClass="form-control mb-2" />
                    <asp:Button ID="btnUploadContent" runat="server" Text="Upload Content" CssClass="btn btn-primary" OnClick="btnUploadContent_Click" />
                    <asp:Label ID="lblUploadMsg" runat="server" CssClass="mt-2 d-block"></asp:Label>
                </div>

                <!-- 3. Post Announcement -->
                <div class="tab-pane fade" id="announcement">
                    <h4>Post Announcement</h4>
                    <asp:DropDownList ID="ddlAnnouncementCourses" runat="server" CssClass="form-select mb-2" />
                    <asp:TextBox ID="txtTitle" runat="server" CssClass="form-control mb-2" placeholder="Title" />
                    <asp:TextBox ID="txtAnnouncement" runat="server" TextMode="MultiLine" Rows="4" CssClass="form-control mb-2" placeholder="Content" />
                    <asp:Button ID="btnPostAnnouncement" runat="server" Text="Post Announcement" CssClass="btn btn-secondary" OnClick="btnPostAnnouncement_Click" />
                    <asp:Label ID="lblPostMsg" runat="server" CssClass="mt-2 d-block"></asp:Label>
                </div>
                <div class="tab-pane fade" id="attendance">
                    <h4>Attendance Report</h4>

                    <asp:DropDownList
                        ID="ddlAttendanceCourses"
                        runat="server"
                        CssClass="form-select mb-2"
                        AutoPostBack="true"
                        OnSelectedIndexChanged="ddlAttendanceCourses_SelectedIndexChanged" />

                    <asp:GridView
                        ID="gvAttendance"
                        runat="server"
                        CssClass="table table-bordered"
                        AutoGenerateColumns="false"
                        EmptyDataText="No records.">
                        <Columns>
                            <asp:BoundField DataField="StudentName" HeaderText="Student" />
                            <asp:BoundField DataField="Date" HeaderText="Date" DataFormatString="{0:yyyy-MM-dd}" />
                            <asp:BoundField DataField="Status" HeaderText="Status" />
                        </Columns>
                    </asp:GridView>
                </div>
                <!-- 4. Mark Attendance -->
                <div class="tab-pane fade" id="markAttendance">
                    <h4>Mark Attendance</h4>
                    <asp:DropDownList
                        ID="ddlAttendanceSections" runat="server"
                        AutoPostBack="True"
                        OnSelectedIndexChanged="ddlAttendanceSections_Mark_SelectedIndexChanged"
                        CssClass="form-select mb-2" />

                    <asp:GridView
                        ID="gvMarkAttendance" runat="server"
                        AutoGenerateColumns="False"
                        DataKeyNames="StudentID"
                        CssClass="table"
                        EmptyDataText="No students enrolled.">

                        <Columns>
                            <asp:BoundField DataField="StudentID" Visible="False" />
                            <asp:BoundField DataField="StudentName" HeaderText="Student" />
                            <asp:TemplateField HeaderText="Present?">
                                <ItemTemplate>
                                    <asp:CheckBox ID="chkPresent" runat="server" />
                                </ItemTemplate>
                            </asp:TemplateField>
                        </Columns>
                    </asp:GridView>

                    <asp:Button
                        ID="btnSaveAttendance" runat="server"
                        Text="Save Attendance"
                        CssClass="btn btn-primary mt-2"
                        OnClick="btnSaveAttendance_Click" />

                    <asp:Label
                        ID="lblAttendanceMsg" runat="server"
                        CssClass="d-block mt-2"></asp:Label>
                </div>


                <!-- 5. Enrolled Students -->
                <div class="tab-pane fade" id="students">
                    <h4>Enrolled Students</h4>
                    <asp:DropDownList ID="ddlEnrollmentSections" runat="server" CssClass="form-select mb-2" AutoPostBack="true" OnSelectedIndexChanged="ddlEnrollmentSections_SelectedIndexChanged" />
                    <asp:GridView ID="gvEnrolledStudents" runat="server" CssClass="table table-bordered" AutoGenerateColumns="false">
                        <Columns>
                            <asp:BoundField DataField="FullName" HeaderText="Name" />
                            <asp:BoundField DataField="Email" HeaderText="Email" />
                        </Columns>
                    </asp:GridView>
                </div>

                <!-- 6. Assignments (Faculty creates specs) -->
                <div class="tab-pane fade" id="assignments">
                    <h4>Create Assignment</h4>
                    <asp:DropDownList ID="ddlAssignSections" runat="server" CssClass="form-select mb-2" />
                    <asp:TextBox ID="txtAssignTitle" runat="server" CssClass="form-control mb-2" placeholder="Assignment Title" />
                    <asp:TextBox ID="txtDueDate" runat="server" CssClass="form-control mb-2" placeholder="Due Date (YYYY-MM-DD)" />
                    <asp:TextBox ID="txtMaxPoints" runat="server" CssClass="form-control mb-2" placeholder="Max Points" />
                    <asp:FileUpload ID="fileAssignment" runat="server" CssClass="form-control mb-2" />
                    <asp:Button ID="btnCreateAssignment" runat="server" Text="Create Assignment" CssClass="btn btn-primary" OnClick="btnCreateAssignment_Click" />
                    <asp:Label ID="lblAssignMsg" runat="server" CssClass="mt-2 d-block"></asp:Label>
                </div>

                <!-- 7. Grade Submissions -->
                <div class="tab-pane fade" id="grading">
                    <h4>Grade Submissions</h4>

                    <!-- Section selector (you already have this) -->
                    <asp:DropDownList
                        ID="ddlGradeSections" runat="server"
                        AutoPostBack="True"
                        OnSelectedIndexChanged="ddlGradeSections_SelectedIndexChanged"
                        CssClass="form-select mb-2" />

                    <!-- ← Re-added assignment selector -->
                    <asp:DropDownList
                        ID="ddlAssignments" runat="server"
                        AutoPostBack="True"
                        OnSelectedIndexChanged="ddlAssignments_SelectedIndexChanged"
                        CssClass="form-select mb-2">
                        <asp:ListItem Text="-- Select Assignment --" Value="" />
                    </asp:DropDownList>

                    <asp:GridView
                        ID="gvSubmissions" runat="server"
                        AutoGenerateColumns="False"
                        DataKeyNames="SubmissionID"
                        CssClass="table"
                        EmptyDataText="No submissions found.">
                        <Columns>
                            <asp:BoundField DataField="StudentName" HeaderText="Student" />
                            <asp:TemplateField HeaderText="File">
                                <ItemTemplate>
                                    <a href='<%# Eval("FileURL") %>' target="_blank">View</a>
                                </ItemTemplate>
                            </asp:TemplateField>
                            <asp:TemplateField HeaderText="Grade">
                                <ItemTemplate>
                                    <asp:TextBox
                                        ID="txtGrade" runat="server"
                                        Text='<%# Eval("Grade") %>'
                                        CssClass="form-control"
                                        Width="60px" />
                                </ItemTemplate>
                            </asp:TemplateField>
                        </Columns>
                    </asp:GridView>

                    <asp:Button
                        ID="btnSaveGrades" runat="server"
                        Text="Save Grades"
                        CssClass="btn btn-primary mt-2"
                        OnClick="btnSaveGrades_Click" />

                    <asp:Label
                        ID="lblGradeMsg" runat="server"
                        CssClass="d-block mt-2"></asp:Label>
                </div>


            </div>
        </div>
    </form>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const hf = document.getElementById('<%= hfActiveTab.ClientID %>');
            const last = hf.value;
            if (last) new bootstrap.Tab(document.querySelector(`#dashboardTabs a[href="${last}"]`)).show();
            document.querySelectorAll('#dashboardTabs a').forEach(a => {
                a.addEventListener('shown.bs.tab', e => hf.value = e.target.getAttribute('href'));
            });
        });
    </script>
</body>
</html>
