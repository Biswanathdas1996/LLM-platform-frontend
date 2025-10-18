"""
RAG API routes for document processing and retrieval
"""
import os
import logging
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from services.rag_service import RAGService

logger = logging.getLogger(__name__)

def create_rag_blueprint(config) -> Blueprint:
    """Create and configure the RAG API blueprint."""
    
    rag = Blueprint('rag', __name__, url_prefix='/api/rag')
    
    # Initialize RAG service with config
    rag_service = RAGService(storage_path=config.UPLOAD_FOLDER + '/rag_storage', config=config)
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'md', 'html', 'htm', 'csv', 'json'}
    
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    @rag.route('/indexes', methods=['GET'])
    def list_indexes():
        """List all available indexes"""
        try:
            result = rag_service.list_indexes()
            return jsonify(result), 200
        except Exception as e:
            logger.error(f"Error listing indexes: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/indexes', methods=['POST'])
    def create_index():
        """Create a new index"""
        try:
            data = request.get_json()
            index_name = data.get('index_name')
            
            if not index_name:
                return jsonify({'error': 'index_name is required'}), 400
            
            # Sanitize index name
            index_name = secure_filename(index_name)
            
            result = rag_service.create_index(index_name)
            
            if 'error' in result:
                return jsonify(result), 400
            
            return jsonify(result), 201
            
        except Exception as e:
            logger.error(f"Error creating index: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/indexes/<index_name>', methods=['GET'])
    def get_index_info(index_name):
        """Get information about a specific index"""
        try:
            result = rag_service.get_index_info(index_name)
            
            if 'error' in result:
                return jsonify(result), 404
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Error getting index info: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/indexes/<index_name>', methods=['DELETE'])
    def delete_index(index_name):
        """Delete an index"""
        try:
            result = rag_service.delete_index(index_name)
            
            if 'error' in result:
                return jsonify(result), 404
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Error deleting index: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/indexes/<index_name>/documents', methods=['GET'])
    def list_documents(index_name):
        """List all documents in an index"""
        try:
            result = rag_service.list_documents(index_name)
            
            if 'error' in result:
                return jsonify(result), 404
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/indexes/<index_name>/documents/<document_id>', methods=['GET'])
    def get_document_details(index_name, document_id):
        """Get detailed information about a specific document"""
        try:
            result = rag_service.get_document_details(index_name, document_id)
            
            if 'error' in result:
                return jsonify(result), 404
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Error getting document details: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/indexes/<index_name>/documents/<document_id>', methods=['DELETE'])
    def delete_document(index_name, document_id):
        """Delete a specific document from an index"""
        try:
            result = rag_service.delete_document(index_name, document_id)
            
            if 'error' in result:
                return jsonify(result), 404
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/upload', methods=['POST'])
    def upload_documents():
        """Upload documents to an index"""
        try:
            # Check if index_name is provided
            index_name = request.form.get('index_name')
            if not index_name:
                return jsonify({'error': 'index_name is required'}), 400
            
            # Check if files are provided
            if 'files' not in request.files:
                return jsonify({'error': 'No files provided'}), 400
            
            files = request.files.getlist('files')
            
            if not files or all(file.filename == '' for file in files):
                return jsonify({'error': 'No files selected'}), 400
            
            # Process metadata if provided
            metadata = {}
            if 'metadata' in request.form:
                import json
                try:
                    metadata = json.loads(request.form['metadata'])
                except:
                    pass
            
            results = []
            errors = []
            
            # Process each file
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    
                    # Save file temporarily
                    temp_path = os.path.join(config.UPLOAD_FOLDER, 'temp', filename)
                    os.makedirs(os.path.dirname(temp_path), exist_ok=True)
                    file.save(temp_path)
                    
                    try:
                        # Process and add to index
                        result = rag_service.upload_document(
                            index_name=index_name,
                            filepath=temp_path,
                            filename=filename,
                            metadata=metadata
                        )
                        
                        if 'error' in result:
                            errors.append({
                                'filename': filename,
                                'error': result['error']
                            })
                        else:
                            results.append({
                                'filename': filename,
                                'document_id': result['document_id'],
                                'chunks': result['chunks'],
                                'size': result['size']
                            })
                    
                    finally:
                        # Clean up temp file
                        if os.path.exists(temp_path):
                            os.remove(temp_path)
                
                else:
                    errors.append({
                        'filename': file.filename,
                        'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
                    })
            
            return jsonify({
                'success': len(results) > 0,
                'processed': results,
                'errors': errors,
                'total_processed': len(results),
                'total_errors': len(errors)
            }), 200 if results else 400
            
        except Exception as e:
            logger.error(f"Error uploading documents: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/query', methods=['POST'])
    def query_documents():
        """Query documents in an index"""
        try:
            data = request.get_json()
            
            index_name = data.get('index_name')
            query = data.get('query')
            
            if not index_name or not query:
                return jsonify({'error': 'index_name and query are required'}), 400
            
            # Optional parameters
            k = data.get('k', 5)
            mode = data.get('mode', 'hybrid')  # 'vector', 'keyword', or 'hybrid'
            
            if mode not in ['vector', 'keyword', 'hybrid']:
                return jsonify({'error': 'mode must be one of: vector, keyword, hybrid'}), 400
            
            result = rag_service.query(
                index_name=index_name,
                query=query,
                k=k,
                mode=mode
            )
            
            if 'error' in result:
                return jsonify(result), 400
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Error querying documents: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/query-multiple', methods=['POST'])
    def query_multiple_indexes():
        """Query multiple indexes and return merged results"""
        try:
            data = request.get_json()
            
            index_names = data.get('index_names', [])
            query = data.get('query')
            
            if not index_names or not query:
                return jsonify({'error': 'index_names (array) and query are required'}), 400
            
            if not isinstance(index_names, list):
                return jsonify({'error': 'index_names must be an array'}), 400
            
            # Optional parameters
            k = data.get('k', 5)
            mode = data.get('mode', 'hybrid')  # 'vector', 'keyword', or 'hybrid'
            
            if mode not in ['vector', 'keyword', 'hybrid']:
                return jsonify({'error': 'mode must be one of: vector, keyword, hybrid'}), 400
            
            result = rag_service.query_multiple_indexes(
                index_names=index_names,
                query=query,
                k=k,
                mode=mode
            )
            
            if 'error' in result:
                return jsonify(result), 400
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Error querying multiple indexes: {e}")
            return jsonify({'error': str(e)}), 500
    
    @rag.route('/health', methods=['GET'])
    def health_check():
        """RAG service health check"""
        try:
            indexes = rag_service.list_indexes()
            return jsonify({
                'status': 'healthy',
                'indexes_count': len(indexes.get('indexes', [])),
                'service': 'RAG Service'
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 500
    
    return rag