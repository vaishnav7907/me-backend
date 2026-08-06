const newArrivalModel = require("../../model/newArrivals/newArrivalsModel");

const createNewArrivals = async (req, res) => {
  try {
    const { description, image, category, name } = req.body;
    const createnew = await newArrivalModel.create({
      description,
      image,
      category,
      name,
    });
    await createnew.save();
    res.status(201).json(createnew);
  } catch (error) {
    console.log(" error in create new ariivals :", error);
    res.status(500).json({ error: "iinternal server error" });
  }
};

const updateNewArrivals = async (req, res) => {
  try {
    const { description, image, category, name } = req.body;
const {id} = req.params
    const updtnewarrival = await newArrivalModel.findByIdAndUpdate(id,
      { description, image, category, name },
      { new: true },
    );

    res.status(201).json(updtnewarrival)
  } catch (error) {
    console.log("error in updt new arrival",error);
    res.status(500).json(error)
  }
};
 

const getNewArrivals= async (req,res)=>{
  try {
    const getallnewarrivals= await newArrivalModel.find()
    res.status(201).json(getallnewarrivals)
  } catch (error) {
    console.log("error in get all new arrivals",error);
    res.status(500).json(error)
    
  }
}

const deleteNewArrivals= async (req,res)=>{
try {
  const {id}=req.params
  const dltnewArrivals = await newArrivalModel.findByIdAndDelete(id)
  res.status(200).json({message:"successfully deleted"})
} catch (error) {
  console.log("error in deletion of new arrivals",error);
  res.status(500).json({message:"error in deletetion of new arrivals",data:error})
  
}
}
module.exports = { createNewArrivals, updateNewArrivals,getNewArrivals,deleteNewArrivals};
