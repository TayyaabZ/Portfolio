using System;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web.UI.WebControls;

namespace SmartCampusPortal
{
    public partial class FacultyDashboard : System.Web.UI.Page
    {
        private DataClassesDataContext db;

        protected void Page_Load(object sender, EventArgs e)
        {
            if (Session["Username"] == null || Session["Role"]?.ToString() != "Faculty")
            {
                Response.Redirect("~/Login.aspx");
                return;
            }

            db = new DataClassesDataContext(
                ConfigurationManager.ConnectionStrings["SmartCampusDBConnectionString"].ConnectionString);

            if (!IsPostBack)
            {
                BindSectionsGrid();
                BindAllDropdowns();
            }
        }
        protected void btnUploadContent_Click(object sender, EventArgs e)
        {
            if (fileCourseContent.HasFile)
            {
                try
                {
                    string fileName = Path.GetFileName(fileCourseContent.FileName);
                    string uploadPath = Server.MapPath("~/CourseContent/");
                    if (!Directory.Exists(uploadPath))
                    {
                        Directory.CreateDirectory(uploadPath);
                    }

                    fileCourseContent.SaveAs(Path.Combine(uploadPath, fileName));
                    lblUploadMsg.Text = "Course content uploaded successfully!";
                    lblUploadMsg.ForeColor = System.Drawing.Color.Green;
                }
                catch (Exception ex)
                {
                    lblUploadMsg.Text = "Error uploading file: " + ex.Message;
                    lblUploadMsg.ForeColor = System.Drawing.Color.Red;
                }
            }
            else
            {
                lblUploadMsg.Text = "Please select a file to upload.";
                lblUploadMsg.ForeColor = System.Drawing.Color.Red;
            }
        }

        private int GetCurrentFacultyID()
        {
            string username = Session["Username"].ToString();
            return db.Users
                     .Where(u => u.Username == username)
                     .Join(db.Faculties,
                           u => u.UserID,
                           f => f.UserID,
                           (u, f) => f.FacultyID)
                     .FirstOrDefault();
        }

        private void BindSectionsGrid()
        {
            int fid = GetCurrentFacultyID();
            var sections = db.CourseSections
                             .Where(cs => cs.FacultyID == fid)
                             .Select(cs => new
                             {
                                 cs.SectionID,
                                 cs.Course.Title,
                                 cs.Semester,
                                 cs.Year
                             })
                             .ToList();

            gvSections.DataSource = sections;
            gvSections.DataBind();
        }

        private void BindAllDropdowns()
        {
            int fid = GetCurrentFacultyID();

            // 1) Fetch raw data from DB
            var raw = db.CourseSections
                        .Where(cs => cs.FacultyID == fid)
                        .Select(cs => new
                        {
                            cs.SectionID,
                            Title = cs.Course.Title,
                            Semester = cs.Semester,
                            Year = cs.Year
                        })
                        .ToList();  // bring into memory

            // 2) Build display strings locally
            var list = raw
                       .Select(x => new
                       {
                           x.SectionID,
                           Display = $"{x.Title} ({x.Semester} {x.Year})"
                       })
                       .ToList();

            // 3) Helper to bind any DropDownList
            Action<DropDownList> setup = ddl =>
            {
                ddl.DataSource = list;
                ddl.DataTextField = "Display";
                ddl.DataValueField = "SectionID";
                ddl.DataBind();
                ddl.Items.Insert(0, new ListItem("-- Select Section --", ""));
            };

            setup(ddlMySections);
            setup(ddlAnnouncementCourses);
            setup(ddlAttendanceCourses);
            setup(ddlAttendanceSections);
            setup(ddlEnrollmentSections);
            setup(ddlAssignSections);
            setup(ddlGradeSections);
        }

        protected void btnCreateAssignment_Click(object sender, EventArgs e)
        {
            lblAssignMsg.Text = "";
            lblAssignMsg.ForeColor = System.Drawing.Color.Red;

            // Validate form inputs
            if (ddlAssignSections.SelectedIndex == 0)
            {
                lblAssignMsg.Text = "Please select a section.";
                return;
            }

            if (!fileAssignment.HasFile)
            {
                lblAssignMsg.Text = "Please select a file to upload.";
                return;
            }

            if (!DateTime.TryParse(txtDueDate.Text.Trim(), out DateTime dueDate))
            {
                lblAssignMsg.Text = "Invalid due date format.";
                return;
            }

            if (!int.TryParse(txtMaxPoints.Text.Trim(), out int maxPoints))
            {
                lblAssignMsg.Text = "Max points must be a number.";
                return;
            }

            try
            {
                string filename = Guid.NewGuid() + "_" + Path.GetFileName(fileAssignment.FileName);
                string uploadFolder = Server.MapPath("~/Content/Assignments/");

                if (!Directory.Exists(uploadFolder))
                    Directory.CreateDirectory(uploadFolder);

                string fullPath = Path.Combine(uploadFolder, filename);
                fileAssignment.SaveAs(fullPath);

                // Instantiate DataContext with your connection string
                string conn = ConfigurationManager
                                 .ConnectionStrings["SmartCampusDBConnectionString"]
                                 .ConnectionString;

                using (var context = new DataClassesDataContext(conn))
                {
                    var newAssignment = new Assignment
                    {
                        SectionID = int.Parse(ddlAssignSections.SelectedValue),
                        Title = txtAssignTitle.Text.Trim(),
                        DueDate = dueDate,
                        MaxPoints = maxPoints,
                        FileURL = "~/Content/Assignments/" + filename,
                        UploadDate = DateTime.Now
                    };

                    context.Assignments.InsertOnSubmit(newAssignment);
                    context.SubmitChanges();
                }

                lblAssignMsg.Text = "Assignment uploaded and saved successfully!";
                lblAssignMsg.ForeColor = System.Drawing.Color.Green;

                txtAssignTitle.Text = "";
                txtDueDate.Text = "";
                txtMaxPoints.Text = "";
                ddlAssignSections.SelectedIndex = 0;
            }
            catch (Exception ex)
            {
                lblAssignMsg.Text = "An error occurred: " + ex.Message;
                lblAssignMsg.ForeColor = System.Drawing.Color.Red;
            }
        }



        protected void btnPostAnnouncement_Click(object sender, EventArgs e)
        {
            lblPostMsg.Text = "";
            if (ddlAnnouncementCourses.SelectedIndex > 0 && !string.IsNullOrWhiteSpace(txtTitle.Text))
            {
                var ann = new Announcement
                {
                    SectionID = int.Parse(ddlAnnouncementCourses.SelectedValue),
                    FacultyID = GetCurrentFacultyID(),
                    Title = txtTitle.Text.Trim(),
                    Content = txtAnnouncement.Text.Trim(),
                    PostDate = DateTime.Now
                };
                db.Announcements.InsertOnSubmit(ann);
                db.SubmitChanges();

                lblPostMsg.CssClass = "text-success";
                lblPostMsg.Text = "Announcement posted.";
                txtTitle.Text = txtAnnouncement.Text = "";
            }
            else
            {
                lblPostMsg.CssClass = "text-danger";
                lblPostMsg.Text = "Please select a section and enter a title.";
            }
        }

        protected void ddlAttendanceCourses_SelectedIndexChanged(object sender, EventArgs e)
        {
            gvAttendance.DataSource = null;
            gvAttendance.DataBind();

            if (ddlAttendanceCourses.SelectedIndex > 0)
            {
                int sec = int.Parse(ddlAttendanceCourses.SelectedValue);
                var report = db.Attendances
                               .Where(a => a.SectionID == sec)
                               .Select(a => new
                               {
                                   StudentName = a.Student.User.FullName,
                                   a.Date,
                                   a.Status
                               })
                               .ToList();

                gvAttendance.DataSource = report;
                gvAttendance.DataBind();
            }
        }

        protected void ddlEnrollmentSections_SelectedIndexChanged(object sender, EventArgs e)
        {
            gvEnrolledStudents.DataSource = null;
            gvEnrolledStudents.DataBind();

            if (ddlEnrollmentSections.SelectedIndex > 0)
            {
                int sec = int.Parse(ddlEnrollmentSections.SelectedValue);
                var studs = db.StudentCourses
                              .Where(sc => sc.SectionID == sec)
                              .Select(sc => new
                              {
                                  sc.Student.User.FullName,
                                  sc.Student.User.Email
                              })
                              .ToList();

                gvEnrolledStudents.DataSource = studs;
                gvEnrolledStudents.DataBind();
            }
        }

        protected void ddlGradeSections_SelectedIndexChanged(object sender, EventArgs e)
        {
            ddlAssignments.Items.Clear();
            lblGradeMsg.Text = "";

            if (ddlGradeSections.SelectedIndex > 0)
            {
                int sec = int.Parse(ddlGradeSections.SelectedValue);
                var assigns = db.Assignments
                                .Where(a => a.SectionID == sec)
                                .Select(a => new { a.AssignmentID, a.Title })
                                .ToList();

                ddlAssignments.DataSource = assigns;
                ddlAssignments.DataTextField = "Title";
                ddlAssignments.DataValueField = "AssignmentID";
                ddlAssignments.DataBind();
                ddlAssignments.Items.Insert(0, new ListItem("-- Select Assignment --", ""));
            }
        }


        protected void ddlAssignments_SelectedIndexChanged(object sender, EventArgs e)
        {
            gvSubmissions.DataSource = null;
            gvSubmissions.DataBind();
            lblGradeMsg.Text = "";

            if (ddlAssignments.SelectedIndex > 0)
            {
                int aid = int.Parse(ddlAssignments.SelectedValue);
                var subs = db.Submissions
                             .Where(s => s.AssignmentID == aid)
                             .Select(s => new
                             {
                                 s.SubmissionID,
                                 StudentName = s.Student.User.FullName,
                                 s.FileURL,
                                 s.Grade
                             })
                             .ToList();

                gvSubmissions.DataSource = subs;
                gvSubmissions.DataBind();
            }
        }
        // Populate the "Mark Attendance" grid when a section is selected
        protected void ddlAttendanceSections_Mark_SelectedIndexChanged(object sender, EventArgs e)
        {
            lblAttendanceMsg.Text = "";
            gvMarkAttendance.DataSource = null;
            gvMarkAttendance.DataBind();

            if (ddlAttendanceSections.SelectedIndex > 0)
            {
                int secID = int.Parse(ddlAttendanceSections.SelectedValue);

                // Get students in that section with correct StudentID
                var students = db.StudentCourses
                                 .Where(sc => sc.SectionID == secID)
                                 .Select(sc => new
                                 {
                                     sc.StudentID,
                                     StudentName = sc.Student.User.FullName
                                 })
                                 .ToList();

                gvMarkAttendance.DataSource = students;
                gvMarkAttendance.DataKeyNames = new[] { "StudentID" }; 
                gvMarkAttendance.DataBind();
            }
        }

        protected void btnSaveAttendance_Click(object sender, EventArgs e)
        {
            if (ddlAttendanceSections.SelectedIndex == 0)
            {
                lblAttendanceMsg.CssClass = "text-danger";
                lblAttendanceMsg.Text = "Please select a section first.";
                return;
            }

            int secID = int.Parse(ddlAttendanceSections.SelectedValue);
            DateTime today = DateTime.Today;

            try
            {
               
                var existing = db.Attendances
                                 .Where(a => a.SectionID == secID && a.Date == today);
                db.Attendances.DeleteAllOnSubmit(existing);

             
                foreach (GridViewRow row in gvMarkAttendance.Rows)
                {
                    int studentID = (int)gvMarkAttendance.DataKeys[row.RowIndex].Value;
                    var chk = (CheckBox)row.FindControl("chkPresent");

                    var att = new Attendance
                    {
                        SectionID = secID,
                        StudentID = studentID, 
                        Date = today,
                        Status = chk.Checked ? "Present" : "Absent"
                    };
                    db.Attendances.InsertOnSubmit(att);
                }

                db.SubmitChanges();

                lblAttendanceMsg.CssClass = "text-success";
                lblAttendanceMsg.Text = "Attendance saved for " + today.ToShortDateString() + ".";
            }
            catch (Exception ex)
            {
                lblAttendanceMsg.CssClass = "text-danger";
                lblAttendanceMsg.Text = "Error saving attendance: " + ex.Message;
            }
        }


        protected void btnSaveGrades_Click(object sender, EventArgs e)
        {
            if (ddlGradeSections.SelectedIndex == 0)
            {
                lblGradeMsg.CssClass = "text-danger";
                lblGradeMsg.Text = "Please select a section.";
                return;
            }

            try
            {
                foreach (GridViewRow row in gvSubmissions.Rows)
                {
                    int subID = (int)gvSubmissions.DataKeys[row.RowIndex].Value;
                    var txt = (TextBox)row.FindControl("txtGrade");

                    if (int.TryParse(txt.Text.Trim(), out int grade))
                    {
                        var submission = db.Submissions.Single(s => s.SubmissionID == subID);
                        submission.Grade = grade;
                    }
                }
                db.SubmitChanges();

                // Rebind so updated grades appear
                ddlGradeSections_SelectedIndexChanged(null, null);

                lblGradeMsg.CssClass = "text-success";
                lblGradeMsg.Text = "Grades saved successfully.";
            }
            catch (Exception ex)
            {
                lblGradeMsg.CssClass = "text-danger";
                lblGradeMsg.Text = "Error saving grades: " + ex.Message;
            }
        }

    }
}
