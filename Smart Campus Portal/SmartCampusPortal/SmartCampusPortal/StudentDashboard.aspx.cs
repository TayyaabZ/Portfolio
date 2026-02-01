using System;
using System.IO;
using System.Linq;
using System.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace SmartCampusPortal
{
    public partial class StudentDashboard : Page
    {
        private DataClassesDataContext db;
        private int studentId;

        protected void Page_Load(object sender, EventArgs e)
        {
            // Role check
            if (Session["UserID"] == null || Session["Role"]?.ToString() != "Student")
                Response.Redirect("~/Login.aspx");

            // Initialize LINQ-to-SQL context
            db = new DataClassesDataContext(
                ConfigurationManager
                  .ConnectionStrings["SmartCampusDBConnectionString"]
                  .ConnectionString);

            if (!IsPostBack)
            {
                LoadProfile();
                LoadCourses();
                LoadAnnouncements();
                LoadAvailableSections();
                PopulateSectionDropdowns();
                hfActiveTab.Value = "tabHome";
            }
            else
            {
                studentId = (int)ViewState["StudentID"];
            }
        }

        private void LoadProfile()
        {
            int userId = Convert.ToInt32(Session["UserID"]);
            var info = (from u in db.Users
                        join s in db.Students on u.UserID equals s.UserID
                        where u.UserID == userId
                        select new
                        {
                            u.Username,
                            u.FullName,
                            u.Email,
                            s.Major,
                            s.EnrollmentDate,
                            s.GPA,
                            s.StudentID
                        }).FirstOrDefault();

            if (info == null)
            {
                Session.Clear();
                Response.Redirect("~/Login.aspx");
            }

            litFullName.Text = info.FullName;
            litUsername.Text = info.Username;
            litEmail.Text = info.Email;
            litMajor.Text = info.Major;
            litEnrollDate.Text = info.EnrollmentDate.ToString("yyyy-MM-dd");
            litGPA.Text = info.GPA?.ToString("F2") ?? "N/A";

            studentId = info.StudentID;
            ViewState["StudentID"] = studentId;
        }

        private void LoadCourses()
        {
            var enrolled = from sc in db.StudentCourses
                           join cs in db.CourseSections on sc.SectionID equals cs.SectionID
                           join c in db.Courses on cs.CourseID equals c.CourseID
                           where sc.StudentID == studentId
                           select new
                           {
                               c.CourseCode,
                               c.Title,
                               cs.Semester,
                               cs.Year,
                               Grade = sc.Grade ?? "—"
                           };

            gvCourses.DataSource = enrolled.ToList();
            gvCourses.DataBind();
        }

        private void LoadAnnouncements()
        {
            var sectionIds = db.StudentCourses
                               .Where(sc => sc.StudentID == studentId)
                               .Select(sc => sc.SectionID)
                               .ToList();

            var anns = db.Announcements
                         .Where(a => a.SectionID.HasValue && sectionIds.Contains(a.SectionID.Value))
                         .OrderByDescending(a => a.PostDate)
                         .Select(a => new {
                             a.Title,
                             a.Content,
                             a.PostDate
                         }).ToList();

            rptAnnouncements.DataSource = anns;
            rptAnnouncements.DataBind();
        }

        private void LoadAvailableSections()
        {
            var enrolledIds = db.StudentCourses
                                .Where(sc => sc.StudentID == studentId)
                                .Select(sc => sc.SectionID);

            var available = from cs in db.CourseSections
                            join c in db.Courses on cs.CourseID equals c.CourseID
                            where !enrolledIds.Contains(cs.SectionID)
                            let prereq = c.PrerequisiteCourseID
                            where prereq == null
                               || db.StudentCourses
                                    .Join(db.CourseSections,
                                          sc => sc.SectionID,
                                          sec => sec.SectionID,
                                          (sc, sec) => sec.CourseID)
                                    .Contains(prereq.Value)
                            select new
                            {
                                cs.SectionID,
                                Label = c.CourseCode + " – " + cs.Semester + " " + cs.Year
                            };

            ddlAvailableSections.Items.Clear();
            ddlAvailableSections.Items.Add(new ListItem("-- Select Section --", ""));
            foreach (var s in available)
                ddlAvailableSections.Items.Add(new ListItem(s.Label, s.SectionID.ToString()));
        }

        private void PopulateSectionDropdowns()
        {
            var mySections = (from sc in db.StudentCourses
                              join cs in db.CourseSections on sc.SectionID equals cs.SectionID
                              join c in db.Courses on cs.CourseID equals c.CourseID
                              where sc.StudentID == studentId
                              select new
                              {
                                  cs.SectionID,
                                  Display = c.CourseCode + " – " + cs.Semester + " " + cs.Year
                              }).Distinct().ToList();

            ddlSectionsContent.DataSource = mySections;
            ddlSectionsContent.DataTextField = "Display";
            ddlSectionsContent.DataValueField = "SectionID";
            ddlSectionsContent.DataBind();
            ddlSectionsContent.Items.Insert(0, new ListItem("-- Select Section --", "0"));

            ddlSectionsAssignments.DataSource = mySections;
            ddlSectionsAssignments.DataTextField = "Display";
            ddlSectionsAssignments.DataValueField = "SectionID";
            ddlSectionsAssignments.DataBind();
            ddlSectionsAssignments.Items.Insert(0, new ListItem("-- Select Section --", "0"));
        }

        protected void ddlSectionsContent_SelectedIndexChanged(object sender, EventArgs e)
        {
            rptCourseContent.DataSource = null;
            rptCourseContent.DataBind();

            if (int.TryParse(ddlSectionsContent.SelectedValue, out int sid) && sid > 0)
            {
                var mats = db.CourseMaterials
                             .Where(m => m.SectionID == sid)
                             .Select(m => new { m.FilePath, m.UploadDate })
                             .ToList();

                rptCourseContent.DataSource = mats;
                rptCourseContent.DataBind();
            }
        }

        protected void ddlSectionsAssignments_SelectedIndexChanged(object sender, EventArgs e)
        {
            pnlAssignmentDetails.Visible = false;
            ddlAssignments.Items.Clear();

            if (!int.TryParse(ddlSectionsAssignments.SelectedValue, out int sid) || sid == 0)
                return;

            var raw = db.Assignments
                        .Where(a => a.SectionID == sid)
                        .OrderBy(a => a.DueDate)
                        .Select(a => new { a.AssignmentID, a.Title, a.DueDate })
                        .ToList();

            var list = raw
                .Select(a => new {
                    a.AssignmentID,
                    Display = $"{a.Title} (Due {a.DueDate:yyyy-MM-dd})"
                }).ToList();

            ddlAssignments.DataSource = list;
            ddlAssignments.DataTextField = "Display";
            ddlAssignments.DataValueField = "AssignmentID";
            ddlAssignments.DataBind();
            ddlAssignments.Items.Insert(0, new ListItem("-- Select Assignment --", "0"));
        }

        protected void ddlAssignments_SelectedIndexChanged(object sender, EventArgs e)
        {
            lblUploadStatus.Text = "";
            pnlAssignmentDetails.Visible = false;

            if (!int.TryParse(ddlAssignments.SelectedValue, out int aid) || aid == 0)
                return;

            var asg = db.Assignments.First(a => a.AssignmentID == aid);
            var sub = db.Submissions.FirstOrDefault(s => s.AssignmentID == aid && s.StudentID == studentId);

            litAsgTitle.Text = asg.Title;
            litAsgDesc.Text = asg.Description;
            litAsgDue.Text = asg.DueDate.ToString("yyyy-MM-dd");
            litAsgGrade.Text = sub?.Grade?.ToString() ?? "Not Submitted";

            hlAsgDownload.NavigateUrl = ResolveUrl(asg.FileURL);
            hlAsgDownload.Visible = true;

            pnlAssignmentDetails.Visible = true;
        }

        protected void btnUploadAssignment_Click(object sender, EventArgs e)
        {
            lblUploadStatus.CssClass = "text-danger";
            lblUploadStatus.Text = "";

            if (!int.TryParse(ddlAssignments.SelectedValue, out int aid) || aid == 0)
            {
                lblUploadStatus.Text = "Please select an assignment.";
                return;
            }
            if (!fuAssignmentUpload.HasFile)
            {
                lblUploadStatus.Text = "Please choose a file.";
                return;
            }

            string fileName = Path.GetFileName(fuAssignmentUpload.FileName);
            string folder = Server.MapPath("~/Uploads/Submissions/");
            if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

            string fullPath = Path.Combine(folder, fileName);
            fuAssignmentUpload.SaveAs(fullPath);
            string relPath = "~/Uploads/Submissions/" + fileName;

            var submission = db.Submissions
                               .FirstOrDefault(s => s.AssignmentID == aid && s.StudentID == studentId);

            if (submission == null)
            {
                submission = new Submission
                {
                    AssignmentID = aid,
                    StudentID = studentId,
                    FileURL = relPath,
                    SubmissionDate = DateTime.Now
                };
                db.Submissions.InsertOnSubmit(submission);
            }
            else
            {
                submission.FileURL = relPath;
                submission.SubmissionDate = DateTime.Now;
            }
            db.SubmitChanges();

            lblUploadStatus.CssClass = "text-success";
            lblUploadStatus.Text = "Upload successful!";
            hfActiveTab.Value = "tabAssign";

            // Refresh assignment details
            ddlAssignments_SelectedIndexChanged(null, null);
        }

        protected void btnEnroll_Click(object sender, EventArgs e)
        {
            lblEnrollMsg.CssClass = "text-danger";
            lblEnrollMsg.Text = "";

            if (!int.TryParse(ddlAvailableSections.SelectedValue, out int sectionId))
            {
                lblEnrollMsg.Text = "Please select a valid section.";
                return;
            }
            if (db.StudentCourses.Any(sc => sc.StudentID == studentId && sc.SectionID == sectionId))
            {
                lblEnrollMsg.Text = "You are already enrolled.";
                return;
            }

            var enroll = new StudentCourse
            {
                StudentID = studentId,
                SectionID = sectionId,
                EnrollmentDate = DateTime.Now
            };
            db.StudentCourses.InsertOnSubmit(enroll);
            db.SubmitChanges();

            lblEnrollMsg.CssClass = "text-success";
            lblEnrollMsg.Text = "Enrolled successfully!";
            LoadCourses();
            LoadAvailableSections();
        }

        protected void btnChangePassword_Click(object sender, EventArgs e)
        {
            lblPasswordMessage.CssClass = "text-danger";
            lblPasswordMessage.Text = "";

            string oldPwd = txtOldPassword.Text.Trim();
            string newPwd = txtNewPassword.Text.Trim();
            string confirm = txtConfirmPassword.Text.Trim();

            if (newPwd != confirm)
            {
                lblPasswordMessage.Text = "New passwords do not match.";
                return;
            }

            var user = db.Users.FirstOrDefault(u => u.UserID == studentId);
            if (user == null)
            {
                lblPasswordMessage.Text = "User not found.";
                return;
            }
            if (user.PasswordHash != PasswordHasher.HashPassword(oldPwd))
            {
                lblPasswordMessage.Text = "Old password is incorrect.";
                return;
            }

            user.PasswordHash = PasswordHasher.HashPassword(newPwd);
            db.SubmitChanges();

            lblPasswordMessage.CssClass = "text-success";
            lblPasswordMessage.Text = "Password changed successfully.";
        }
    }
}
