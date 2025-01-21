import mongoose, {Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'


const videoSchema = new Schema({
     videoFile: {
        type: String,
        required: [true,"Required!"]
     },
     thumbnail: {
        type: String,
        required: [true,"Required!"]
     },
     title: {
        type: String,
        required: [true,"Required!"]
     },
     discription: {
        type: String,
        required: [true,"Required!"]
     },
     duration: {
        type: Number,// sent by cloudinary when we upload the video there
        required: [true,"Required!"]
     },
     views: {
        type: Number,
        default: 0
     },
     isPublished: {
        type:Boolean,
        default: true
     },
     owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
     }

},
{
    timestamps: true
})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)