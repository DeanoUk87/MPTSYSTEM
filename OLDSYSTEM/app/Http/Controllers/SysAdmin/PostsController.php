<?php

namespace App\Http\Controllers\SysAdmin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Models\System\Post;
use App\Models\System\Upload;
use Auth;
use Carbon\Carbon;
use DB;
use Excel;
use Illuminate\Http\Request;
use PDF;
use Validator;
use Yajra\Datatables\Datatables;

class PostsController extends Controller
{
    use Uploader;

    /**
     * PostsController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier']);
        // $this->middleware(['auth', 'verifier'])->except('index', 'show');
    }

    /**
     * Display post view.
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('sysadmin.posts.index');
    }

    /**
     * Load post data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        $post = Post::all();

        return Datatables::of($post)

            ->addColumn('checkbox', function ($post) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$post->id.'" class="check-style filled-in blue" onclick="toggleBtn()" value="'.$post->id.'"> 
                        <label for="box-'.$post->id.'" class="checkinner"></label>';
            })
            ->addColumn('action', function ($post) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-'.$post->id.'" onclick="viewDetails(\''.url('admin/posts/details').'\','.$post->id.')" class="btn btn-info btn-xs" data-toggle="tooltip"><i class="fa fa-eye"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$post->id.'" onclick="editForm(\''.url('admin/posts/edit').'\','.$post->id.')" class="btn btn-success btn-xs "><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$post->id.'" onclick="deleteData(\''.url('admin/posts/delete').'\','.$post->id.')" class="btn btn-danger btn-xs rest-delete"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action'])->make(true);
    }

    /**
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        // fetch post detail info
        $post = Post::findOrFail($id);
        $uploads = Upload::where('relatedId', $post->id)->where('tablekey', 'posts')->get();

        // pass posts data to view and load list view
        return view('sysadmin.posts.details', compact('post', 'uploads'));
    }

    /**
     * Load post form
     *
     * @return mixed
     */
    public function insert()
    {
        return view('sysadmin.posts.create');
    }

    /**
     * Process post insert form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),
            [
                'title' => 'required|max:200',
                'content' => 'required',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            // insert post data
            $data = Post::create($request->all());
            if ($request->hasFile('picture')) {

                $valFile = Validator::make($request->all(), [$this->imageRules()]);

                if ($valFile->fails()) {
                    return response()->json(['message' => $valFile->errors()->all()]);
                } else {
                    $filekey = $request->file('picture');
                    /* upload dir default is /uploads. You can change it e.g $this->singleupload($filekey,'resize','uploads/folder') */
                    $singleImg = $this->singleupload($filekey, 'resize', 'uploads'); /* use 'mixed' or 'resize' */
                    /* update DB table */
                    $data->update(['picture' => $singleImg]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => trans('app.add.success'),
            ]);
        }
    }

    /**
     * Load post edit form
     *
     * @return mixed
     */
    public function edit($id)
    {
        // get post data by id
        $post = Post::findOrFail($id);
        $uploads = Upload::where('relatedId', $post->id)->where('tablekey', 'posts')->get();

        // load form view
        return view('sysadmin.posts.edit', compact('post', 'uploads'));
    }

    /**
     * Process post edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        // validate post data
        $validator = Validator::make($request->all(),
            [
                'title' => 'required|max:200',
                'content' => 'required',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $posts = Post::findOrFail($id);
            $posts->title = $request->input('title');
            $posts->content = $request->input('content');
            $posts->modified = Carbon::now(config('timezone'))->toDateTimeString();

            if ($request->hasFile('picture')) {

                $valFile = Validator::make($request->all(), [$this->imageRules()]);

                if ($valFile->fails()) {
                    return response()->json(['message' => $valFile->errors()->all()]);
                } else {
                    $filekey = $request->file('picture');
                    /* upload dir default is /uploads. You can change it e.g $this->singleupload($filekey,'resize','uploads/folder') */
                    $filename = $this->singleupload($filekey, 'resize'); /* use 'mixed' or 'resize' */
                    /* update DB table */
                    $posts->picture = $filename;
                }
            }
            $posts->save();

            return response()->json([
                'success' => true,
                'message' => trans('app.update.success'),
            ]);
        }
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            $post = Post::findOrFail($id);
            if ($post->picture) {
                $this->deleteFile('uploads/'.$post->picture);
                $post->picture = '';
                $post->save();
            }
            Post::findOrFail($id)->delete();

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * Delete File
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyFile($id, Request $request)
    {
        if ($request->ajax()) {
            $post = Post::findOrFail($id);
            $this->deleteFile('uploads/'.$post->picture);

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * This method handle file delete from related table which were uploaded using the multiple upload option.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyFile2(Request $request, $id)
    {
        if ($request->ajax()) {
            $this->deleteFileWith($id);

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * Delete with checkbox
     *
     * @param  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletemulti(Request $request)
    {
        // if ( $request->ajax() ) {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Post::where('id', $id)->delete();
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
        }

        // }
        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /* REPORTING */

    /**
     * Export to PDF
     *
     * @return mixed
     */
    public function exportPDF(Request $request)
    {
        $posts = Post::all();
        $pdf = PDF::loadView('sysadmin.posts.print', compact('posts'));

        return $pdf->download('posts_data.pdf');
        // return $pdf->stream('posts_data.pdf'); //print to browser
    }

    /**
     * Export to PDF
     *
     * @param  Request  $request
     * @return mixed
     */
    public function exportDetailPDF($id)
    {
        $post = Post::findOrFail($id);
        $pdf = PDF::loadView('sysadmin.posts.print-details', compact('post'));

        return $pdf->download('posts_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('sysadmin.posts.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('posts_file')) {
            $path = $request->file('posts_file')->getRealPath();
            $data = Excel::load($path)->get();
            if ($data->count()) {
                foreach ($data as $key => $value) {
                    $arr[] = ['title' => $value->title, 'content' => $value->content, 'created' => $value->created, 'modified' => $value->modified];
                }
                if (! empty($arr)) {
                    DB::table('hts_posts')->insert($arr);

                    // return back()->withInput()->with('status', 'Record Imported Successfully!');
                    return response()->json(['success' => true, 'message' => trans('app.import.success')]);
                }
            }
        }

        return response()->json(['error' => true, 'message' => trans('app.import.error')]);
        // return back()->withInput()->with('status', 'Request data does not have any files to import.');
    }

    /**
     * Export to csv and excel
     *
     * @return mixed
     */
    public function exportFile($type)
    {
        $posts = Post::all('title', 'content', 'created', 'modified')->toArray();

        return Excel::create('posts_data', function ($excel) use ($posts) {
            $excel->sheet('Post Data', function ($sheet) use ($posts) {
                $sheet->fromArray($posts);
            });
        })->download($type);
    }
}
