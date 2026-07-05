import { prisma } from "@/app/db";
import { Plus, Users } from "lucide-react";
import { createMaterial, assignMaterial } from "./actions";

export default async function TrainingAdminPanel() {
  const materials = await prisma.trainingMaterial.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assignments: true
    }
  });

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h2 className="text-xl font-bold">Admin: Training Management</h2>
          <p className="text-sm text-muted-foreground">Manage materials and compliance assignments.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <div className="bg-card border rounded-xl shadow p-4 space-y-4 h-fit">
          <h3 className="font-semibold border-b pb-2">Add New Material</h3>
          <form action={createMaterial} className="space-y-3">
            <div>
              <label className="text-xs font-medium">Title</label>
              <input type="text" name="title" required className="w-full h-8 px-2 text-sm border rounded" />
            </div>
            <div>
              <label className="text-xs font-medium">Description</label>
              <textarea name="description" className="w-full p-2 text-sm border rounded" rows={3} />
            </div>
            <div>
              <label className="text-xs font-medium">URL / Document Link</label>
              <input type="url" name="url" className="w-full h-8 px-2 text-sm border rounded" />
            </div>
            <div>
              <label className="text-xs font-medium">Target Role</label>
              <select name="roleTarget" className="w-full h-8 px-2 text-sm border rounded bg-transparent">
                <option value="ALL">All Roles</option>
                <option value="DOCTOR">Doctors</option>
                <option value="TECHNICIAN">Technicians</option>
                <option value="RECEPTION">Reception</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" name="isRequired" id="isRequired" className="rounded border-gray-300" />
              <label htmlFor="isRequired" className="text-xs font-medium">Mandatory Training</label>
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex w-full items-center justify-center rounded bg-vin-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-vin-accent/80"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Material
            </button>
          </form>
        </div>

        <div className="bg-card border rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">Material</th>
                <th className="p-3 text-left font-medium">Target</th>
                <th className="p-3 text-left font-medium">Compliance</th>
                <th className="p-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materials.map(mat => {
                const total = mat.assignments.length;
                const completed = mat.assignments.filter(a => a.status === "COMPLETED").length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <tr key={mat.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{mat.title}</div>
                      <div className="text-xs text-muted-foreground">{mat.isRequired ? 'Mandatory' : 'Optional'}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs bg-muted px-2 py-1 rounded font-medium">{mat.roleTarget || "ALL"}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{completed}/{total} ({percentage}%)</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <form action={async () => {
                        "use server";
                        await assignMaterial(mat.id);
                      }}>
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded border border-vin-border bg-vin-panel px-3 py-2 text-sm font-semibold text-vin-text2 transition hover:bg-vin-tableSelected hover:text-white"
                        >
                          <Users className="w-4 h-4 mr-2" /> Push to Users
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
              {materials.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No materials found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
