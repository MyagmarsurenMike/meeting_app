"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBreakpoint } from "../lib/useBreakpoint";

interface ProjectTask {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  type: "task" | "milestone";
  teamId: string;
  assignedTo?: string[]; // Change here
}

interface GanttTask extends Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: "task" | "milestone";
  assignedTo?: string[]; // Change here
}

interface TeamMember {
  id: string;
  name: string;
}

interface TeamGanttChartProps {
  teamId: string;
  showAddControls?: boolean; // New prop
}

const TeamGanttChart: React.FC<TeamGanttChartProps> = ({
  teamId,
  showAddControls = true, // Default to true so it shows by default elsewhere
}) => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [newTask, setNewTask] = useState({
    name: "",
    startDate: "",
    endDate: "",
    progress: 0,
    type: "task" as "task" | "milestone",
    assignedTo: [] as string[], // Change here
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editTask, setEditTask] = useState<GanttTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchTasks(storedToken);
      fetchTeamMembers(storedToken);
    } else {
      setError("Please log in to view tasks");
    }
  }, [teamId]);

  const fetchTeamMembers = async (authToken: string) => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/members`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        setTeamMembers(response.data.members);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to fetch team members");
    }
  };

  const fetchTasks = async (authToken: string) => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/tasks`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data.success) {
        const ganttTasks: GanttTask[] = response.data.tasks.map(
          (task: ProjectTask) => ({
            id: task._id,
            name: task.name,
            start: new Date(task.startDate),
            end: new Date(task.endDate),
            progress: task.progress,
            type: task.type as "task" | "milestone",
            assignedTo: task.assignedTo,
          })
        );
        setTasks(ganttTasks);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to fetch tasks");
    }
  };

  const addTask = async () => {
    if (!token) {
      setError("Please log in to add tasks");
      return;
    }
    // Prevent double submission
    if (addTask.loading) return;
    addTask.loading = true;
    if (!newTask.name || !newTask.startDate || !newTask.endDate) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const response = await axios.post(`/api/teams/${teamId}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setNewTask({
          name: "",
          startDate: "",
          endDate: "",
          progress: 0,
          type: "task",
          assignedTo: [] as string[],
        });
        setIsModalOpen(false);
        await fetchTasks(token); // Await to ensure only one update
        toast.success("Task added successfully");
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to add task");
    } finally {
      addTask.loading = false;
    }
  };
  // Add a static property to prevent double submission
  addTask.loading = false;

  const updateTask = async () => {
    if (!token || !editTask) {
      // editTask is still needed for its ID
      setError("Please log in to update tasks");
      return;
    }
    try {
      // Calculate progress based on the current (potentially edited) dates in newTask
      const currentProgress = calculateProgress(
        newTask.startDate,
        newTask.endDate
      );

      const payload = {
        name: newTask.name,
        startDate: newTask.startDate, // newTask.startDate is already a 'YYYY-MM-DD' string
        endDate: newTask.endDate, // newTask.endDate is already a 'YYYY-MM-DD' string
        progress: currentProgress, // Send the freshly calculated progress
        type: newTask.type,
        assignedTo: newTask.assignedTo.length > 0 ? newTask.assignedTo : undefined,
      };

      const response = await axios.patch(
        `/api/teams/${teamId}/tasks/${editTask.id}`, // URL uses the ID from the original task
        payload, // Payload now uses the edited data from newTask
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setEditTask(null);
        setIsModalOpen(false);
        await fetchTasks(token); // Await fetchTasks to ensure data is fresh
        toast.success("Task updated successfully");
      } else {
        setError(response.data.message || "Failed to update task");
        toast.error(response.data.message || "Failed to update task");
      }
    } catch (err: any) {
      console.error(
        "Update task error:",
        err.response?.data || err.message || err
      );
      const message =
        err.response?.data?.message || err.message || "Failed to update task";
      setError(message);
      toast.error(message);
    }
  };

  const openAddModal = () => {
    setEditTask(null);
    setNewTask({
      name: "",
      startDate: "",
      endDate: "",
      progress: 0,
      type: "task",
      assignedTo: [] as string[],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: GanttTask) => {
    const startDate = task.start.toLocaleDateString("en-CA");
    const endDate = task.end.toLocaleDateString("en-CA");

    setEditTask(task);
    setNewTask({
      name: task.name,
      startDate: startDate,
      endDate: endDate,
      progress: calculateProgress(startDate, endDate),
      type: task.type,
      assignedTo: task.assignedTo || [],
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (editTask) {
      updateTask();
    } else {
      addTask();
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!token) {
      setError("Please log in to delete tasks");
      return;
    }
    try {
      const response = await axios.delete(
        `/api/teams/${teamId}/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        fetchTasks(token);
        setIsModalOpen(false);
        toast.success("Task deleted successfully");
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to delete task");
    }
  };

  const calculateProgress = (start: string, end: string): number => {
    if (!start || !end) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();

    // If task hasn't started yet
    if (today < startDate) return 0;

    // If task is completed or past due
    if (today >= endDate) return 100;

    // Calculate progress percentage
    const totalDuration = endDate.getTime() - startDate.getTime();
    const completedDuration = today.getTime() - startDate.getTime();
    const progress = Math.round((completedDuration / totalDuration) * 100);

    return progress;
  };

  const isNarrow = useBreakpoint();
  const columnWidth = isNarrow ? 80 : 60;
  const listCellWidth = isNarrow ? "100px" : "200px";

  return (
    <div className="mx-auto max-w-screen px-4 py-6 sm:px-6 sm:py-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Team Gantt Chart</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      {showAddControls && (
        <button
          onClick={openAddModal}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          Add Task/Milestone
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm sm:max-w-md md:max-w-lg rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              {editTask ? "Edit Task/Milestone" : "Add Task/Milestone"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Task Name"
                value={newTask.name}
                onChange={(e) =>
                  setNewTask({ ...newTask, name: e.target.value })
                }
                className="border p-2 w-full"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTask.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.startDate
                      ? format(new Date(newTask.startDate), "PPP")
                      : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      newTask.startDate
                        ? new Date(newTask.startDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      setNewTask({
                        ...newTask,
                        startDate: date ? date.toLocaleDateString("en-CA") : "",
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newTask.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.endDate
                      ? format(new Date(newTask.endDate), "PPP")
                      : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      newTask.endDate ? new Date(newTask.endDate) : undefined
                    }
                    onSelect={(date) =>
                      setNewTask({
                        ...newTask,
                        endDate: date ? date.toLocaleDateString("en-CA") : "",
                      })
                    }
                    disabled={(date) =>
                      newTask.startDate
                        ? date < new Date(newTask.startDate)
                        : false
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <select
                value={newTask.type}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    type: e.target.value as "task" | "milestone",
                  })
                }
                className="border p-2 w-full"
              >
                <option value="task">Task</option>
                <option value="milestone">Milestone</option>
              </select>

              {/* Assign to team member */}
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Assign to:</label>
                <div className="mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={newTask.assignedTo.length === 0 && teamMembers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTask({ ...newTask, assignedTo: [] }); // All members
                        }
                      }}
                    />
                    <span className="ml-2">All Members</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {teamMembers.map((member) => (
                    <label key={member.id} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          newTask.assignedTo.length === 0
                            ? true // All members selected
                            : newTask.assignedTo.includes(member.id)
                        }
                        onChange={(e) => {
                          let updated: string[];
                          if (e.target.checked) {
                            // Add member
                            updated = [...new Set([...newTask.assignedTo, member.id])];
                            // If all are checked, treat as all members (empty array)
                            if (
                              updated.length === teamMembers.length ||
                              updated.length === 0
                            ) {
                              setNewTask({ ...newTask, assignedTo: [] });
                            } else {
                              setNewTask({ ...newTask, assignedTo: updated });
                            }
                          } else {
                            // Remove member
                            updated = newTask.assignedTo.filter((id) => id !== member.id);
                            // If none checked, treat as all members (empty array)
                            if (updated.length === 0) {
                              setNewTask({ ...newTask, assignedTo: [] });
                            } else {
                              setNewTask({ ...newTask, assignedTo: updated });
                            }
                          }
                        }}
                        disabled={newTask.assignedTo.length === 0}
                      />
                      <span className="ml-2">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded"
              >
                {editTask ? "Update" : "Add"}
              </button>
              {editTask && (
                <button
                  onClick={() => deleteTask(editTask.id)}
                  className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {tasks.length > 0 ? (
        <div className="overflow-x-auto w-full">
          {/* enforce a reasonable minimum width so columns never collapse to zero */}
          <div className="inline-block min-w-[600px]">
            <Gantt
              tasks={tasks}
              viewMode={ViewMode.Day}
              columnWidth={columnWidth}
              listCellWidth={listCellWidth}
              barCornerRadius={3}
              barProgressColor="#4caf50"
              barBackgroundColor="#2196f3"
              milestoneBackgroundColor="#f44336"
              todayColor="red"
              onClick={(task) =>
                openEditModal({
                  id: task.id,
                  name: task.name,
                  start: task.start,
                  end: task.end,
                  progress: task.progress,
                  type: task.type as "task" | "milestone",
                  assignedTo: (task as GanttTask).assignedTo, // <-- cast here
                })
              }
              TooltipContent={({ task }) => {
                const ganttTask = task as GanttTask; // <-- cast here
                if (!ganttTask.assignedTo || ganttTask.assignedTo.length === 0) {
                  return (
                    <div className="p-2">
                      <h3 className="font-bold">{ganttTask.name}</h3>
                      <p>Progress: {ganttTask.progress}%</p>
                      <p>Assigned to: All Members</p>
                    </div>
                  );
                }
                const assignedMembers = teamMembers.filter((m) =>
                  ganttTask.assignedTo?.includes(m.id)
                );
                return (
                  <div className="p-2">
                    <h3 className="font-bold">{ganttTask.name}</h3>
                    <p>Progress: {ganttTask.progress}%</p>
                    <p>
                      Assigned to: {assignedMembers.map((m) => m.name).join(", ")}
                    </p>
                  </div>
                );
              }}
            />
          </div>
        </div>
      ) : (
        <p>No tasks available</p>
      )}
    </div>
  );
};

export default TeamGanttChart;
