using System;
using System.Linq;
using System.Configuration;
using System.Web.UI.WebControls;
using SmartCampusPortal;

namespace SmartCampusPortal
{
    public partial class AdminDashboard : System.Web.UI.Page
    {
        private DataClassesDataContext db;

        protected void Page_Load(object sender, EventArgs e)
        {
            // Only admins
            if (Session["UserID"] == null ||
                Session["Role"]?.ToString() != "Admin")
            {
                Response.Redirect("~/Login.aspx");
                return;
            }

            // Setup data context
            db = new DataClassesDataContext(
                ConfigurationManager
                  .ConnectionStrings["SmartCampusDBConnectionString"]
                  .ConnectionString);

            if (!IsPostBack)
            {
                LoadSummary();
                LoadCoursesForDropdowns();
                
                LoadStudents();
                LoadUsers();
                LoadFacultyList();
            }
        }

        #region Load Methods
        private void LoadFacultyList()
        {
            var facultyList = from f in db.Faculties
                              join u in db.Users on f.UserID equals u.UserID
                              select new
                              {
                                  f.FacultyID,
                                  u.FullName
                              };

            ddlSectionFaculty.DataSource = facultyList.ToList();
            ddlSectionFaculty.DataTextField = "FullName";
            ddlSectionFaculty.DataValueField = "FacultyID";
            ddlSectionFaculty.DataBind();
            ddlSectionFaculty.Items.Insert(0, new ListItem("--- Choose Faculty ---", ""));
        }

        private void LoadSummary()
        {
            litTotalUsers.Text = db.Users.Count().ToString();
            litTotalStudents.Text = db.Students.Count().ToString();
            litTotalFaculty.Text = db.Faculties.Count().ToString();
        }

        private void LoadCoursesForDropdowns()
        {
            // Prereq and Course dropdowns
            var courses = db.Courses
                            .Select(c => new
                            {
                                c.CourseID,
                                Label = c.CourseCode + " – " + c.Title
                            })
                            .ToList();

            ddlCourses.Items.Clear();
            ddlCourses.Items.Add(new ListItem("-- Select Course --", ""));
            ddlPrereq.Items.Clear();
            ddlPrereq.Items.Add(new ListItem("-- No Prerequisite --", ""));

            foreach (var c in courses)
            {
                ddlCourses.Items.Add(new ListItem(c.Label, c.CourseID.ToString()));
                ddlPrereq.Items.Add(new ListItem(c.Label, c.CourseID.ToString()));
            }
        }

      

        private void LoadStudents()
        {
            var studs = db.Students
                         .Join(db.Users,
                               s => s.UserID, u => u.UserID,
                               (s, u) => new
                               {
                                   s.StudentID,
                                   Label = u.FullName + " (" + u.Username + ")"
                               })
                         .ToList();

            ddlStudents.Items.Clear();
            ddlStudents.Items.Add(new ListItem("-- Select Student --", ""));
            foreach (var s in studs)
                ddlStudents.Items.Add(new ListItem(s.Label, s.StudentID.ToString()));
        }

        private void LoadUsers()
        {
            gvUsers.DataSource = db.Users
                                  .Select(u => new
                                  {
                                      u.Username,
                                      u.FullName,
                                      u.Email,
                                      u.Role
                                  })
                                  .ToList();
            gvUsers.DataBind();
        }

        #endregion

        #region Event Handlers

        protected void btnCreateCourse_Click(object sender, EventArgs e)
        {
            lblCourseMsg.CssClass = "text-danger";
            lblCourseMsg.Text = "";

            if (string.IsNullOrWhiteSpace(txtCourseCode.Text) ||
                string.IsNullOrWhiteSpace(txtCourseTitle.Text) ||
                !int.TryParse(txtCredits.Text, out int cr))
            {
                lblCourseMsg.Text = "Code, Title, and valid Credits required.";
                return;
            }
            if (db.Courses.Any(c => c.CourseCode == txtCourseCode.Text.Trim()))
            {
                lblCourseMsg.Text = "Course code exists.";
                return;
            }

            var course = new Course
            {
                CourseCode = txtCourseCode.Text.Trim(),
                Title = txtCourseTitle.Text.Trim(),
                Description = txtCourseDesc.Text.Trim(),
                Credits = cr,
                PrerequisiteCourseID = string.IsNullOrEmpty(ddlPrereq.SelectedValue)
                                      ? (int?)null
                                      : int.Parse(ddlPrereq.SelectedValue)
            };
            db.Courses.InsertOnSubmit(course);
            db.SubmitChanges();

            lblCourseMsg.CssClass = "text-success";
            lblCourseMsg.Text = "Course created.";
            txtCourseCode.Text = txtCourseTitle.Text = txtCourseDesc.Text = txtCredits.Text = "";
            LoadCoursesForDropdowns();
        }

        protected void btnCreateSection_Click(object sender, EventArgs e)
        {
            lblSectionMsg.CssClass = "text-danger";
            lblSectionMsg.Text = "";

            if (!int.TryParse(ddlCourses.SelectedValue, out int cid) ||
                string.IsNullOrWhiteSpace(txtSemester.Text) ||
                !int.TryParse(txtYear.Text, out int yr) ||
                string.IsNullOrWhiteSpace(txtSchedule.Text) ||
                string.IsNullOrWhiteSpace(txtLocation.Text))
            {
                lblSectionMsg.Text = "All fields required.";
                return;
            }

            var section = new CourseSection
            {
                CourseID = cid,
                Semester = txtSemester.Text.Trim(),
                Year = yr,
                Schedule = txtSchedule.Text.Trim(),
                Location = txtLocation.Text.Trim(),
                FacultyID = Convert.ToInt32(ddlSectionFaculty.SelectedValue)
            };
            db.CourseSections.InsertOnSubmit(section);
            db.SubmitChanges();

            lblSectionMsg.CssClass = "text-success";
            lblSectionMsg.Text = "Section created.";
            txtSemester.Text = txtYear.Text = txtSchedule.Text = txtLocation.Text = "";
       
        }

        

        protected void btnUpdateMajor_Click(object sender, EventArgs e)
        {
            lblMajorMessage.CssClass = "text-danger";
            lblMajorMessage.Text = "";

            if (!int.TryParse(ddlStudents.SelectedValue, out int stid))
            {
                lblMajorMessage.Text = "Select a student.";
                return;
            }
            if (string.IsNullOrWhiteSpace(txtNewMajor.Text))
            {
                lblMajorMessage.Text = "Enter a major.";
                return;
            }

            var student = db.Students.FirstOrDefault(s => s.StudentID == stid);
            if (student == null)
            {
                lblMajorMessage.Text = "Student not found.";
                return;
            }
            student.Major = txtNewMajor.Text.Trim();
            db.SubmitChanges();

            lblMajorMessage.CssClass = "text-success";
            lblMajorMessage.Text = "Major updated.";
            LoadStudents();
        }

        protected void btnRegisterAdmin_Click(object sender, EventArgs e)
        {
            lblAdminMessage.CssClass = "text-danger";
            lblAdminMessage.Text = "";

            if (string.IsNullOrWhiteSpace(txtAdminUsername.Text) ||
                string.IsNullOrWhiteSpace(txtAdminFullName.Text) ||
                string.IsNullOrWhiteSpace(txtAdminEmail.Text) ||
                string.IsNullOrWhiteSpace(txtAdminPassword.Text))
            {
                lblAdminMessage.Text = "All fields required.";
                return;
            }
            if (db.Users.Any(u => u.Username == txtAdminUsername.Text.Trim() ||
                                  u.Email == txtAdminEmail.Text.Trim()))
            {
                lblAdminMessage.Text = "Username/email in use.";
                return;
            }

            var user = new User
            {
                Username = txtAdminUsername.Text.Trim(),
                FullName = txtAdminFullName.Text.Trim(),
                Email = txtAdminEmail.Text.Trim(),
                PasswordHash = PasswordHasher.HashPassword(txtAdminPassword.Text),
                Role = "Admin",
                IsActive = true
            };
            db.Users.InsertOnSubmit(user);
            db.SubmitChanges();

            lblAdminMessage.CssClass = "text-success";
            lblAdminMessage.Text = "Admin registered.";
            txtAdminUsername.Text = txtAdminFullName.Text = txtAdminEmail.Text = txtAdminPassword.Text = "";
            LoadSummary();
            LoadUsers();
        }

        protected void btnRegisterFaculty_Click(object sender, EventArgs e)
        {
            lblFacultyMessage.CssClass = "text-danger";
            lblFacultyMessage.Text = "";

            if (string.IsNullOrWhiteSpace(txtFacultyUsername.Text) ||
                string.IsNullOrWhiteSpace(txtFacultyFullName.Text) ||
                string.IsNullOrWhiteSpace(txtFacultyEmail.Text) ||
                string.IsNullOrWhiteSpace(txtFacultyPassword.Text) ||
                string.IsNullOrWhiteSpace(txtFacultyDepartment.Text) ||
                string.IsNullOrWhiteSpace(txtFacultyPosition.Text))
            {
                lblFacultyMessage.Text = "All fields required.";
                return;
            }
            if (db.Users.Any(u => u.Username == txtFacultyUsername.Text.Trim() ||
                                  u.Email == txtFacultyEmail.Text.Trim()))
            {
                lblFacultyMessage.Text = "Username/email in use.";
                return;
            }

            var userF = new User
            {
                Username = txtFacultyUsername.Text.Trim(),
                FullName = txtFacultyFullName.Text.Trim(),
                Email = txtFacultyEmail.Text.Trim(),
                PasswordHash = PasswordHasher.HashPassword(txtFacultyPassword.Text),
                Role = "Faculty",
                IsActive = true
            };
            db.Users.InsertOnSubmit(userF);
            db.SubmitChanges();

            var fac = new Faculty
            {
                UserID = userF.UserID,
                Department = txtFacultyDepartment.Text.Trim(),
                Position = txtFacultyPosition.Text.Trim(),
                HireDate = DateTime.Now
            };
            db.Faculties.InsertOnSubmit(fac);
            db.SubmitChanges();

            lblFacultyMessage.CssClass = "text-success";
            lblFacultyMessage.Text = "Faculty registered.";
            txtFacultyUsername.Text = txtFacultyFullName.Text = txtFacultyEmail.Text =
            txtFacultyPassword.Text = txtFacultyDepartment.Text = txtFacultyPosition.Text = "";
            LoadSummary();
            LoadUsers();
        }

        #endregion
    }
}
