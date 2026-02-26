import { listWorkerApplications, listClientSignups } from "@/server/actions/application-actions";
import ApplicationsManager from "./ApplicationsManager";

export default async function ApplicationsPage() {
  const [workerApps, clientSignups] = await Promise.all([
    listWorkerApplications(),
    listClientSignups(),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white">Applications</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Review worker applications and client signup requests.
      </p>
      <div className="mt-6">
        <ApplicationsManager
          workerApplications={JSON.parse(JSON.stringify(workerApps))}
          clientSignups={JSON.parse(JSON.stringify(clientSignups))}
        />
      </div>
    </div>
  );
}
