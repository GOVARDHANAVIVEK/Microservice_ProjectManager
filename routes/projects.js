const router = require('express').Router()
const {verifyToken,verifyRole} = require('../middleware/helper')
const Projects = require('../models/projects')
const TaskManagerURI = process.env.TaskManagerURI
const axios = require('axios');

router.get('/',async(req,res)=>{
    const project  = await Projects.find();
    return res.status(200).json({
        project
    })
});

router.post('/createProject',verifyToken,verifyRole(['Project_Manager','Admin']),async(req,res)=>{
    const {name,description,startDate,endDate,tasks} = req.body;
    console.log({name,description,startDate,endDate,tasks})
    try {
        const existingProject  = await Projects.findOne({ProjectId:`Proj-${name}`});
        if(existingProject) return res.status(400).json({
            status:400,
            message:"Project name already exists."
        })
        const newProject = new Projects({
            ProjectId:`Proj-${name}`,
            Name: name,
            Description:description,
            StartDate:"" ,
            EndDate: "",
            Tasks: tasks
        });
        req.project = `Proj-${name}`
        console.log("req.project==>"+req.project)
        console.log(newProject)
        await newProject.save();
        return res.status(200).json({
            success:true,
            status:200,
            ok:true,
            data:newProject
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status:500,
            message:"Something went wrong.",
            Error:error
        });
    }

})

router.put('/:projectId/addTask',verifyToken,verifyRole(['Project_Manager','Admin']),async(req,res)=>{

    const { projectId } = req.params;
    let {taskId}  = req.body;
    console.log("taskid: ", taskId, "type: ", typeof taskId);
    if (!taskId) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "TaskId is required.",
      });
    }
  
    try {
      const project = await Projects.findOne({ ProjectId: projectId });
  
      if (!project) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Project not found.",
        });
      }
  
      project.Tasks.push(String(taskId));
  
      console.log("Updated Tasks: ", project.Tasks);

      await project.save();
  
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Task added to project successfully.",
        data: project,
      });
    } catch (error) {
      console.error("Error updating project:", error.message);
  
      return res.status(500).json({
        success: false,
        status: 500,
        message: "Internal server error.",
        error: error.message,
      });
    }
  });

router.get('/:projectId',async(req,res)=>{
    
    const { projectId } = req.params;
    console.log("projectId"+projectId)
    try {
        const project = await Projects.findOne({ProjectId:projectId});
        if(project){
            return res.status(200).json({
                success:true,
                status:200,
                ok:true,
                result:project
            })
        }
        return res.status(404).json({
            success:false,
            status:404,
            message:"Project not found",
        });
        
    } catch (error) {
        return res.status(500).json({
            success:false,
            status:500,
            ok:false,
            message:"Something went wrong",
            Error:error
        })
    }
});


router.delete('/:projectId/:taskId',verifyToken,verifyRole(['Project_Manager','Admin']),async(req,res)=>{
    const { projectId,taskId} = req.params;
 
    console.log({ projectId,taskId } )
    try {
        const project = await Projects.findOne({ProjectId:projectId});
        if(!project){
            return res.status(404).json({
                status:404,
                success:false,
                message:"No project found"
            });

        }
        // Convert taskId to a string and trim whitespace if any

    console.log("After conversion taskId:", String(taskId).trim());

// Now check if taskId is in the project's Tasks array
    if (project.Tasks.includes(String(taskId).trim())) {
        let index = project.Tasks.indexOf(String(taskId).trim());
        console.log("index:", index);

        // If the taskId exists, remove it from the array
        if (index !== -1) {
            project.Tasks.splice(index, 1);  // Remove the taskId at the found index
            await project.save();
            return res.status(200).json({
                success:true,
                ok:true,
                status:200,
                message:"Task removed successfully",
                data:project
               })  // Save the updated project
        }
    } else {
        console.log("Task not found in the project.");
    }
              
       
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            ok:false,
            status:500,
            message:"something went wrong",
            Error:error
           })
    }
})

router.put('/updateProject/:projectId',verifyToken,verifyRole(['Project_Manager','Admin']),async(req,res)=>{
    const {projectId} = req.params;
    const {name,description,startDate,endDate} = req.body;
    try {
        const project = await Projects.findOne({ProjectId:projectId});
        
        if(!project) return res.status(404).json({
            status:404,
            success:false,
            ok:false,
            message:"No project found."
        })
        if(name) project.Name = name;
        if(description) project.Description = description;
        if(startDate) project.StartDate = startDate;
        if(endDate) project.EndDate =endDate;
        project.ProjectId = `Proj-${project.Name}`;
        await project.save();

        const taskUpdatePromises = project.Tasks.map(async (task) => {
            const taskUrl = `${TaskManagerURI}/${task}`;
            try {
                // Fetch the task details to ensure it exists
                const response = await fetch(taskUrl, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${req.token}`,
                        "Content-Type": "application/json",
                    },
                });
        
                if (!response.ok) {
                    console.error(`Failed to fetch task ${task}: ${response.statusText}`);
                    return;
                }
        
                const data = await response.json();
                console.log(`Fetched task: ${taskUrl}`, data);
        
                // If task exists and the response indicates success, update it
                if (data.success) {
                    console.log(`Updating task: ${taskUrl} with ProjectId: ${project.ProjectId}, ${req.token}`);
                    const updateResponse = await fetch(taskUrl, {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${req.token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ projectId: project.ProjectId }),
                    });
        
                    if (!updateResponse.ok) {
                        const errorData = await updateResponse.json();
                        console.error(
                            `Failed to update task ${task}: ${updateResponse.statusText}`,
                            errorData
                        );
                        return;
                    }
        
                    console.log(`Successfully updated task: ${task}`);
                }
            } catch (error) {
                console.error(`Error updating task ${task}:`, error.message);
            }
        });
        
        await Promise.all(taskUpdatePromises);
        
        

        return res.status(200).json({
            success:true,
            status:200,
            ok:true,
            data:project
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            status:500,
            ok:false,
            message:"Something went wrong",
            Error:error
        }) 
    }
});

router.delete('/:projectId',verifyToken,verifyRole(['Project_Manager','Admin']),async(req,res)=>{
    const {projectId} = req.params;

    try {
        const project = await Projects.findOne({ProjectId:projectId});

        if(!project){
            return res.status(404).json({
                success:false,
                status:404,
                message:"Project not found."
            })
        }

        const taskUpdatePromises = project.Tasks.map(async (task) => {
            const taskUrl = `${TaskManagerURI}/${task}`;
            try {
                // Fetch the task details to ensure it exists
                const response = await fetch(taskUrl, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${req.token}`,
                        "Content-Type": "application/json",
                    },
                    
                });
        
                if (!response.ok) {
                    console.error(`Failed to fetch task ${task}: ${response.statusText}`);
                    return;
                }
        
                const data = await response.json();
                console.log(`Fetched task: ${taskUrl}`, data);
        
            } catch (error) {
                console.error(`Error updating task ${task}:`, error.message);
            }
        });
        
        await Promise.all(taskUpdatePromises);

        await project.deleteOne()
        return res.status(200).json({
            success:true,
            ok:true,
            status:200,
            message:"Project Deleted Successfully"
        })
    } catch (error) {
        return res.status(500).json({

            status:500,
            message:"Something went wrong",
            Error:error

        })  
    }
})
module.exports = router;